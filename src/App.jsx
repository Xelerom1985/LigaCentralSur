import { useState, useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, ref, onValue, push, update, increment, adminSignIn, adminSignOut, setTorneoPrefix } from './firebase'

const parseDevice = () => {
  const ua = navigator.userAgent
  let so = 'Otro', modelo = 'Desconocido', browser = 'Otro'
  if (/iPhone/.test(ua))       { so = 'iOS';     modelo = 'iPhone' }
  else if (/iPad/.test(ua))    { so = 'iOS';     modelo = 'iPad' }
  else if (/Android/.test(ua)) {
    so = 'Android'
    const m = ua.match(/Android [^;]+;\s*([^)]+)/)
    modelo = m ? m[1].trim() : 'Android'
  } else if (/Windows/.test(ua)) { so = 'Windows'; modelo = 'PC' }
  else if (/Macintosh/.test(ua)) { so = 'macOS';   modelo = 'Mac' }
  if (/CriOS/.test(ua))             browser = 'Chrome'
  else if (/Chrome/.test(ua))       browser = 'Chrome'
  else if (/Firefox/.test(ua))      browser = 'Firefox'
  else if (/Edg/.test(ua))          browser = 'Edge'
  else if (/Safari/.test(ua))       browser = 'Safari'
  return { so, modelo, browser }
}
import Navbar from './components/Navbar'
import Home from './components/Home'
import Fixture from './components/Fixture'
import Tabla from './components/Tabla'
import Copas from './components/Copas'
import Equipos from './components/Equipos'
import Stats from './components/Stats'
import Admin from './components/Admin'
import MiEquipo from './components/MiEquipo'

const PIN = '2041'
const CRED_KEY = 'lcs_admin_cred'
const SESSION_KEY = 'lcs_admin_session'
const DATA_CACHE_KEY = 'lcs_data_cache'
const MI_EQUIPO_PREFIX = 'lcs_mi_equipo_'
const PUBLIC_PATHS = ['equipos', 'jugadores', 'partidos', 'goles', 'tarjetas', 'novedades', 'copas_equipos', 'master_fixture', 'home_fecha', 'fechas_cerradas', 'premios_manual', 'analytics']
// Prefijo de Firebase por torneo. 'sabados' (la 1ra edición) vive en la raíz ('').
const TORNEO_PREFIJOS = { domingos: 'domingos/', sabados2: 'sabados2/' }
const prefijoDe = t => TORNEO_PREFIJOS[t] || ''

export default function App() {
  const [data, setData] = useState({})
  // Última copia de los datos públicos guardada en el dispositivo, para poder
  // ver Inicio/Fixture/Tabla/Stats sin conexión (Equipos y Copas quedan afuera)
  const [cachedData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || '{}') } catch { return {} }
  })
  const TORNEO_KEY = 'lcs_torneo'
  // null = lobby, 'sabados' | 'sabados2' | 'domingos' — se restaura desde localStorage para que un refresh no vuelva al lobby
  const [torneo, setTorneo] = useState(() => {
    const guardado = localStorage.getItem(TORNEO_KEY)
    return ['sabados', 'sabados2', 'domingos'].includes(guardado) ? guardado : null
  })
  // Ir al lobby (casita) borra la preferencia guardada; elegir un torneo la guarda
  const irAlLobby = () => { localStorage.removeItem(TORNEO_KEY); setTorneo(null); setMiEquipo(undefined) }
  const elegirYGuardarTorneo = t => { localStorage.setItem(TORNEO_KEY, t); setTorneo(t) }
  // null = "ver general"; teamId string = equipo elegido; undefined = no eligió aún
  const [miEquipo, setMiEquipo] = useState(() => {
    const torneoGuardado = localStorage.getItem(TORNEO_KEY)
    if (!['sabados', 'sabados2', 'domingos'].includes(torneoGuardado)) return undefined
    const val = localStorage.getItem(MI_EQUIPO_PREFIX + torneoGuardado)
    if (val === null) return undefined
    return val === '' ? null : val
  })
  const elegirMiEquipo = id => {
    localStorage.setItem(MI_EQUIPO_PREFIX + torneo, id ?? '')
    setMiEquipo(id ?? null)
    setSeccion(seccion === 'miequipo' ? 'miequipo' : 'home')
  }

  const [seccion, setSeccion] = useState('home')
  const [authed, setAuthed] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  // Biometría
  const [bioAvail, setBioAvail] = useState(false)
  const [hasCred, setHasCred] = useState(false)
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  const [bioError, setBioError] = useState(false)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  // Usuarios comunes: la nueva versión se activa en segundo plano, sin botón y sin recargar la pantalla.
  // Solo el admin ve el banner "Actualizar".
  useEffect(() => {
    if (needRefresh && !authed) updateServiceWorker(false)
  }, [needRefresh, authed])
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  // Sincronizar prefix del torneo activo
  useEffect(() => {
    setTorneoPrefix(prefijoDe(torneo))
    setData({}) // limpiar datos al cambiar de torneo
  }, [torneo])

  // Datos públicos: se leen nodo por nodo (no la raíz completa) para poder
  // dejar 'finanzas' protegido por Firebase Auth sin bloquear el resto del sitio
  useEffect(() => {
    if (!torneo) return
    const prefix = prefijoDe(torneo)
    const unsubs = PUBLIC_PATHS.map(path =>
      onValue(ref(db, prefix + path), snap => setData(prev => ({ ...prev, [path]: snap.val() })))
    )
    return () => unsubs.forEach(u => u())
  }, [torneo])

  // Guardar en el dispositivo cada actualización de los datos públicos (nunca finanzas)
  useEffect(() => {
    const publicos = Object.fromEntries(PUBLIC_PATHS.map(k => [k, data[k]]).filter(([, v]) => v !== undefined))
    if (Object.keys(publicos).length === 0) return
    try { localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(publicos)) } catch {}
  }, [data])

  // Datos con respaldo offline: si todavía no llegó nada de Firebase, se usa
  // la última copia guardada. Solo se usa en Inicio/Fixture/Tabla/Stats.
  const offlineData = { ...cachedData, ...data }

  // Finanzas: privado, solo se escucha estando autenticado
  useEffect(() => {
    if (!authed || !torneo) return
    const prefix = prefijoDe(torneo)
    const unsubF = onValue(ref(db, prefix + 'finanzas'), snap => setData(prev => ({ ...prev, finanzas: snap.val() })))
    const unsubI = onValue(ref(db, prefix + 'inscripciones'), snap => setData(prev => ({ ...prev, inscripciones: snap.val() })))
    return () => { unsubF(); unsubI() }
  }, [authed, torneo])

  // Registrar visita al abrir la app
  useEffect(() => {
    const { so, modelo, browser } = parseDevice()
    push(ref(db, 'analytics/visitas'), { fecha: new Date().toISOString(), ts: Date.now(), so, modelo, browser })
  }, [])

  // Contar visitas por sección
  useEffect(() => {
    if (!seccion || seccion === 'admin') return
    update(ref(db, 'analytics/secciones'), { [seccion]: increment(1) })
  }, [seccion])

  // Verificar soporte de biometría al montar
  useEffect(() => {
    const checkBio = async () => {
      if (!window.PublicKeyCredential) return
      try {
        const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setBioAvail(ok)
        if (ok && localStorage.getItem(CRED_KEY)) setHasCred(true)
      } catch {}
    }
    checkBio()
  }, [])

  useEffect(() => {
    const handler = e => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setShowInstall(false))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const instalarApp = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setInstallPrompt(null)
  }

  const [exitToast, setExitToast] = useState(false)
  const lastBackRef = useRef(0)
  const seccionRef = useRef(seccion)
  useEffect(() => { seccionRef.current = seccion }, [seccion])

  useEffect(() => {
    history.pushState(null, '')
    const handler = () => {
      const cur = seccionRef.current
      if (['fixture', 'tabla', 'stats'].includes(cur)) {
        setSeccion('miequipo')
        history.pushState(null, '')
        return
      }
      if (cur === 'miequipo') {
        setSeccion('home')
        history.pushState(null, '')
        return
      }
      const now = Date.now()
      if (now - lastBackRef.current < 2000) return
      lastBackRef.current = now
      history.pushState(null, '')
      setExitToast(true)
      setTimeout(() => setExitToast(false), 2000)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // Restaurar sesión admin persistida — espera confirmación de Firebase antes de setear authed
  useEffect(() => {
    if (localStorage.getItem(SESSION_KEY) === '1') {
      adminSignIn()
        .then(() => setAuthed(true))
        .catch(() => localStorage.removeItem(SESSION_KEY))
    }
  }, [])

  const [pinErrorMsg, setPinErrorMsg] = useState('PIN incorrecto')
  const entrarAdmin = async () => {
    try {
      await adminSignIn()
    } catch(e) {
      setPinErrorMsg(e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password' ? 'Contraseña Firebase incorrecta' : `Error: ${e?.code || e?.message || 'desconocido'}`)
      setPinError(true); setTimeout(() => setPinError(false), 3000)
      return
    }
    localStorage.setItem(SESSION_KEY, '1')
    setAuthed(true); setShowPin(false); setPinInput(''); setPinError(false); setSeccion('admin')
    if (!torneo) elegirYGuardarTorneo('sabados')
  }

  const navegar = sec => {
    if (sec === 'admin') {
      if (authed) setSeccion('admin')
      else setShowPin(true)
      return
    }
    if (sec === 'miequipo' && !miEquipo) {
      setMiEquipo(undefined)
    }
    setSeccion(sec)
    window.history.pushState(null, '', '/')
  }

  const intentarPin = () => {
    if (pinInput === PIN) {
      entrarAdmin()
      if (bioAvail && !hasCred) setShowBioPrompt(true)
    } else {
      setPinError(true); setTimeout(() => setPinError(false), 1200)
    }
  }

  const handleLockClick = () => {
    if (authed) {
      adminSignOut().catch(() => {})
      localStorage.removeItem(SESSION_KEY)
      // 'lcs_finanzas_session' vive en Admin.jsx — se limpia acá también para que
      // cerrar sesión general vuelva a pedir el PIN de Finanzas la próxima vez
      localStorage.removeItem('lcs_finanzas_session')
      setAuthed(false)
      setSeccion('home')
    } else {
      setShowPin(true)
      setPinInput('')
      setPinError(false)
      setBioError(false)
    }
  }

  // Registrar huella por primera vez
  const registrarHuella = async () => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Liga Central Sur' },
          user: { id: new TextEncoder().encode('lcs-admin'), name: 'admin', displayName: 'Administrador' },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        }
      })
      localStorage.setItem(CRED_KEY, JSON.stringify(Array.from(new Uint8Array(cred.rawId))))
      setHasCred(true)
      setShowBioPrompt(false)
    } catch {
      setShowBioPrompt(false)
    }
  }

  // Autenticar con huella
  const autenticarHuella = async () => {
    setBioError(false)
    try {
      const stored = localStorage.getItem(CRED_KEY)
      if (!stored) return
      const credId = new Uint8Array(JSON.parse(stored))
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: credId, type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        }
      })
      entrarAdmin()
    } catch {
      setBioError(true)
      setTimeout(() => setBioError(false), 2000)
    }
  }

  const elegirTorneo = t => {
    elegirYGuardarTorneo(t)
    // Restaurar equipo guardado para este torneo, o pedir que elija
    const val = localStorage.getItem(MI_EQUIPO_PREFIX + t)
    setMiEquipo(val === null ? undefined : val === '' ? null : val)
    setSeccion(authed ? 'admin' : 'home')
  }

  // ── LOBBY ──────────────────────────────────────────────────────────
  if (!torneo) return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white relative overflow-hidden">
      <img src="/fondo-inicio.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

      {/* Candado admin en lobby */}
      <button onClick={handleLockClick}
        className={`fixed top-3 right-3 z-40 w-11 h-11 flex items-center justify-center transition-colors ${authed ? 'text-green-400/80' : 'text-white/30 active:text-white/60'}`}>
        {authed ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        )}
      </button>

      <div className="relative z-10 min-h-dvh flex flex-col items-center justify-start pt-[22vh] px-8 gap-5">
        <h1 className="text-white text-3xl font-black tracking-tight text-center drop-shadow-lg">Liga Central Sur</h1>

        <div className="w-full max-w-xs flex flex-col gap-4 mt-2">
          {/* SÁBADOS · 2DA EDICIÓN */}
          <button onClick={() => elegirTorneo('sabados2')}
            className="relative w-full bg-green-700/60 backdrop-blur-sm border border-green-500/40 text-white rounded-2xl py-5 text-xl font-black active:scale-95 transition-all shadow-2xl flex flex-col items-center gap-0.5">
            <span className="absolute -top-2.5 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg tracking-wide">2DA EDICIÓN</span>
            <span>⚽ SÁBADOS LIBRE</span>
            <span className="text-sm font-semibold text-green-200/80 tracking-widest uppercase">Pasco Central</span>
          </button>

          {/* DOMINGOS */}
          <button onClick={() => elegirTorneo('domingos')}
            className="w-full bg-green-700/60 backdrop-blur-sm border border-green-500/40 text-white rounded-2xl py-5 text-xl font-black active:scale-95 transition-all shadow-2xl flex flex-col items-center gap-0.5">
            <span>⚽ DOMINGOS</span>
            <span className="text-sm font-semibold text-green-200/80 tracking-widest uppercase">Pasco Central</span>
          </button>

          {/* SÁBADOS · 1RA EDICIÓN (terminada) */}
          <button onClick={() => elegirTorneo('sabados')}
            className="relative w-full bg-gray-600/60 backdrop-blur-sm border border-gray-400/40 text-white rounded-2xl py-5 text-xl font-black active:scale-95 transition-all shadow-2xl flex flex-col items-center gap-0.5">
            <span className="absolute -top-2.5 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg tracking-wide">1RA EDICIÓN</span>
            <span>⚽ SÁBADOS LIBRE</span>
            <span className="text-sm font-semibold text-gray-200/80 tracking-widest uppercase">Pasco Central</span>
          </button>
        </div>
      </div>

      {/* Modal PIN en lobby */}
      {showPin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-green-800 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">⚙️</div>
              <p className="text-white font-bold text-lg">Panel Admin</p>
              <p className="text-gray-400 text-sm">Ingresá el PIN de acceso</p>
            </div>
            <input type="password" inputMode="numeric" maxLength={6}
              value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && intentarPin()}
              placeholder="• • • •"
              className={`w-full bg-[#111] border-2 ${pinError ? 'border-red-500' : 'border-green-800'} rounded-xl px-4 py-3 text-center text-white text-2xl tracking-[0.5em] outline-none mb-2 transition-colors`}
              autoFocus />
            {pinError && <p className="text-red-400 text-sm text-center mb-2 animate-pulse">{pinErrorMsg}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowPin(false); setPinInput('') }} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm">Cancelar</button>
              <button onClick={intentarPin} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm">Entrar</button>
            </div>
            {hasCred && bioAvail && (
              <button onClick={autenticarHuella}
                className="w-full mt-3 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#111] border border-green-900/40 active:scale-95 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 ${bioError ? 'text-red-400' : 'text-green-400'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                </svg>
                <span className={`text-xs font-semibold ${bioError ? 'text-red-400' : 'text-green-400'}`}>{bioError ? 'No se reconoció' : 'Entrar con huella'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // ── SELECCIÓN DE EQUIPO ───────────────────────────────────────────
  if (torneo && miEquipo === undefined) {
    const equiposObj = data.equipos || {}
    const listaEquipos = Object.entries(equiposObj)
      .map(([id, e]) => ({ id, ...e }))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
    const cargando = Object.keys(equiposObj).length === 0

    return (
      <div className="min-h-dvh bg-[#0a0a0a] text-white relative overflow-hidden">
        <img src="/fondo-inicio.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />

        <div className="relative z-10 min-h-dvh flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3">
            <button onClick={irAlLobby} className="w-9 h-9 flex items-center justify-center text-white/50 active:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium">Liga Central Sur</p>
              <p className="text-white font-bold text-base leading-tight">¿De qué equipo sos?</p>
            </div>
          </div>

          <p className="text-white/30 text-xs uppercase tracking-widest font-medium px-4 mb-3">Equipos</p>

          {/* Grid de equipos + Ver todo al final */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {cargando ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl h-24 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {listaEquipos.map(eq => (
                    <button
                      key={eq.id}
                      onClick={() => elegirMiEquipo(eq.id)}
                      className="bg-[#0d1a0f] border border-green-900/40 rounded-2xl p-4 flex flex-col items-center gap-2.5 active:scale-95 transition-all active:border-green-500/60">
                      {eq.escudo
                        ? <img src={eq.escudo} className="w-14 h-14 object-contain" />
                        : <div className="w-14 h-14 rounded-xl bg-green-900/20 flex items-center justify-center">
                            <span className="text-green-400 text-xs font-bold">{(eq.nombre||'').slice(0,3).toUpperCase()}</span>
                          </div>
                      }
                      <p className="text-white text-xs font-semibold text-center leading-tight line-clamp-2">{eq.nombre}</p>
                    </button>
                  ))}
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh text-white" style={{background:'#050d07', paddingBottom:'calc(72px + env(safe-area-inset-bottom, 0px))'}}>
      {/* Banner nueva versión */}
      {needRefresh && authed && (
        <div className="fixed bottom-[72px] inset-x-0 z-50 px-3 pb-2">
          <div className="bg-green-700 text-white text-sm px-4 py-3 rounded-2xl flex items-center justify-between shadow-xl">
            <span className="font-medium">Nueva versión disponible</span>
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-white text-green-800 font-bold px-4 py-1.5 rounded-xl text-sm active:scale-95 transition-all flex-shrink-0"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}

      {/* Banner instalar PWA */}
      {showInstall && (
        <div className="fixed bottom-[72px] inset-x-0 z-40 px-3 pb-2">
          <div className="bg-[#1a1a1a] border border-green-700/60 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
            <img src="/logo.png" className="w-10 h-10 rounded-xl flex-shrink-0 object-contain" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-tight">Liga Central Sur</p>
              <p className="text-gray-400 text-xs leading-tight">Instalá la app en tu dispositivo</p>
            </div>
            <button onClick={() => setShowInstall(false)} className="text-gray-600 text-lg flex-shrink-0 px-1">✕</button>
            <button onClick={instalarApp} className="bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-xl flex-shrink-0 active:scale-95 transition-all">Instalar</button>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {showPin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-green-800 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">⚙️</div>
              <p className="text-white font-bold text-lg">Panel Admin</p>
              <p className="text-gray-400 text-sm">Ingresá el PIN de acceso</p>
            </div>
            <input
              type="password" inputMode="numeric" maxLength={6}
              value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && intentarPin()}
              placeholder="• • • •"
              className={`w-full bg-[#111] border-2 ${pinError ? 'border-red-500' : 'border-green-800'} rounded-xl px-4 py-3 text-center text-white text-2xl tracking-[0.5em] outline-none mb-2 transition-colors`}
              autoFocus
            />
            {pinError && <p className="text-red-400 text-sm text-center mb-2 animate-pulse">{pinErrorMsg}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowPin(false); setPinInput('') }} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm">Cancelar</button>
              <button onClick={intentarPin} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm">Entrar</button>
            </div>

            {/* Botón biometría */}
            {hasCred && bioAvail && (
              <button
                onClick={autenticarHuella}
                className="w-full mt-3 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#111] border border-green-900/40 active:scale-95 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 ${bioError ? 'text-red-400' : 'text-green-400'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                </svg>
                <span className={`text-xs font-semibold ${bioError ? 'text-red-400' : 'text-green-400'}`}>
                  {bioError ? 'No se reconoció' : 'Entrar con huella'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal activar huella (aparece después del primer PIN correcto) */}
      {showBioPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-green-800 shadow-2xl">
            <div className="text-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-14 h-14 text-green-400 mx-auto mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
              </svg>
              <p className="text-white font-bold text-lg">¿Activar huella dactilar?</p>
              <p className="text-gray-400 text-sm mt-1">La próxima vez entrás sin escribir el PIN</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBioPrompt(false)} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm border border-green-900/20">Ahora no</button>
              <button onClick={registrarHuella} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm">Activar</button>
            </div>
          </div>
        </div>
      )}

      {/* Secciones */}
      {seccion === 'home' && <Home data={offlineData} torneo={torneo} miEquipo={miEquipo} onCambiarEquipo={() => { setMiEquipo(undefined); setSeccion('miequipo') }} />}
      {seccion === 'miequipo' && miEquipo && <MiEquipo data={offlineData} torneo={torneo} equipoId={miEquipo} onCambiarEquipo={() => setMiEquipo(undefined)} onNavegar={setSeccion} />}
      {seccion === 'fixture' && <Fixture data={offlineData} torneo={torneo} onBack={() => setSeccion('miequipo')} />}
      {seccion === 'tabla' && <Tabla data={offlineData} onBack={() => setSeccion('miequipo')} />}
      {seccion === 'copas' && <Copas data={data} torneo={torneo} />}
      {seccion === 'equipos' && <Equipos data={data} />}
      {seccion === 'stats' && <Stats data={offlineData} torneo={torneo} onBack={() => setSeccion('miequipo')} />}
      {seccion === 'admin' && authed && <Admin data={data} />}

      <Navbar seccion={seccion} navegar={navegar} torneo={torneo} authed={authed} />

      {/* Botón volver al lobby — píldora con nombre del torneo */}
      <button onClick={irAlLobby}
        className="fixed z-40 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 active:scale-95 transition-all"
        style={{ top: '34px', right: authed ? '106px' : '62px', transform: 'translateY(-50%)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
        <span className="text-white text-[10px] font-semibold tracking-wide">
          Sáb / Dom
        </span>
        <span className="text-white/40 text-[9px]">▾</span>
      </button>

      {/* Engranaje admin — visible solo cuando authed */}
      {authed && (
        <button
          onClick={() => setSeccion('admin')}
          className="fixed top-3 right-14 z-40 w-11 h-11 flex items-center justify-center text-green-400/80 active:text-green-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Toast salir con back */}
      {exitToast && (
        <div className="fixed bottom-[88px] inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-black/80 text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/10">
            Presioná de nuevo para salir
          </div>
        </div>
      )}

      {/* Candado admin — top right */}
      <button
        onClick={handleLockClick}
        className={`fixed top-3 right-3 z-40 w-11 h-11 flex items-center justify-center transition-colors
          ${authed ? 'text-green-400/80 active:text-green-400' : 'text-white/30 active:text-white/60'}`}
      >
        {authed ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </button>
    </div>
  )
}
