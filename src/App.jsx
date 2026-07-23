import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, ref, onValue, push, update, increment, adminSignIn, adminSignOut } from './firebase'

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

const PIN = '2041'
const CRED_KEY = 'lcs_admin_cred'
const SESSION_KEY = 'lcs_admin_session'
const PUBLIC_PATHS = ['equipos', 'jugadores', 'partidos', 'goles', 'tarjetas', 'novedades', 'copas_equipos', 'master_fixture', 'home_fecha', 'fechas_cerradas', 'analytics']

export default function App() {
  const [data, setData] = useState({})
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
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  // Datos públicos: se leen nodo por nodo (no la raíz completa) para poder
  // dejar 'finanzas' protegido por Firebase Auth sin bloquear el resto del sitio
  useEffect(() => {
    const unsubs = PUBLIC_PATHS.map(path =>
      onValue(ref(db, path), snap => setData(prev => ({ ...prev, [path]: snap.val() })))
    )
    return () => unsubs.forEach(u => u())
  }, [])

  // Finanzas: privado, solo se escucha estando autenticado
  useEffect(() => {
    if (!authed) return
    const unsub = onValue(ref(db, 'finanzas'), snap => setData(prev => ({ ...prev, finanzas: snap.val() })))
    return () => unsub()
  }, [authed])

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

  useEffect(() => {
    const handler = () => {}
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // Restaurar sesión admin persistida (solo el acceso, no navegar a admin)
  useEffect(() => {
    if (localStorage.getItem(SESSION_KEY) === '1') {
      setAuthed(true)
      adminSignIn().catch(() => {})
    }
  }, [])

  const entrarAdmin = async () => {
    try {
      await adminSignIn()
    } catch {
      setPinError(true); setTimeout(() => setPinError(false), 1200)
      return
    }
    localStorage.setItem(SESSION_KEY, '1')
    setAuthed(true); setShowPin(false); setPinInput(''); setPinError(false); setSeccion('admin')
  }

  const navegar = sec => {
    if (sec === 'admin') {
      if (authed) setSeccion('admin')
      else setShowPin(true)
      return
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

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pb-[72px]">
      {/* Banner nueva versión */}
      {needRefresh && (
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
            {pinError && <p className="text-red-400 text-sm text-center mb-2 animate-pulse">PIN incorrecto</p>}
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
      {seccion === 'home' && <Home data={data} />}
      {seccion === 'fixture' && <Fixture data={data} />}
      {seccion === 'tabla' && <Tabla data={data} />}
      {seccion === 'copas' && <Copas data={data} />}
      {seccion === 'equipos' && <Equipos data={data} />}
      {seccion === 'stats' && <Stats data={data} />}
      {seccion === 'admin' && authed && <Admin data={data} />}

      <Navbar seccion={seccion} navegar={navegar} />

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
