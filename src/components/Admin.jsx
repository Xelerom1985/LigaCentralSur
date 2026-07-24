import { useState, useEffect, useRef } from 'react'
import { db, ref, push, update, remove, set } from '../firebase'
import { compressImage } from '../utils/compressImage'

const FASES_OPT = [
  { value: 'liga', label: 'Liga' },
  { value: 'oro_4tos', label: 'Copa Oro · Cuartos' },
  { value: 'oro_semi', label: 'Copa Oro · Semifinal' },
  { value: 'oro_final', label: 'Copa Oro · Final' },
  { value: 'plata_semi', label: 'Copa Plata · Semifinal' },
  { value: 'plata_final', label: 'Copa Plata · Final' },
  { value: 'bronce_4tos', label: 'Copa Bronce · Cuartos' },
  { value: 'bronce_semi', label: 'Copa Bronce · Semifinal' },
  { value: 'bronce_final', label: 'Copa Bronce · Final' },
]

const TABS = ['Equipos', 'Jugadores', 'Partidos', 'Copas', 'Resultados', 'Novedades', 'Finanzas']

const FINANZAS_PIN = '200514687'
const FINANZAS_CRED_KEY = 'lcs_finanzas_cred'
const FINANZAS_SESSION_KEY = 'lcs_finanzas_session'

export default function Admin({ data }) {
  const [tab, setTab] = useState('Equipos')

  const [finanzasAuthed, setFinanzasAuthed] = useState(() => sessionStorage.getItem(FINANZAS_SESSION_KEY) === '1')
  const [showFinanzasPin, setShowFinanzasPin] = useState(false)
  const [finanzasPinInput, setFinanzasPinInput] = useState('')
  const [finanzasPinError, setFinanzasPinError] = useState(false)
  const [finBioAvail, setFinBioAvail] = useState(false)
  const [finHasCred, setFinHasCred] = useState(false)
  const [finBioError, setFinBioError] = useState(false)
  const [showFinBioPrompt, setShowFinBioPrompt] = useState(false)

  useEffect(() => {
    const checkBio = async () => {
      if (!window.PublicKeyCredential) return
      try {
        const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setFinBioAvail(ok)
        if (ok && localStorage.getItem(FINANZAS_CRED_KEY)) setFinHasCred(true)
      } catch {}
    }
    checkBio()
  }, [])

  const entrarFinanzas = () => {
    sessionStorage.setItem(FINANZAS_SESSION_KEY, '1')
    setFinanzasAuthed(true); setShowFinanzasPin(false); setFinanzasPinInput(''); setFinanzasPinError(false)
    setTab('Finanzas')
  }

  const intentarFinanzasPin = () => {
    if (finanzasPinInput === FINANZAS_PIN) {
      entrarFinanzas()
      if (finBioAvail && !finHasCred) setShowFinBioPrompt(true)
    } else {
      setFinanzasPinError(true); setTimeout(() => setFinanzasPinError(false), 1200)
    }
  }

  const registrarHuellaFinanzas = async () => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Liga Central Sur' },
          user: { id: new TextEncoder().encode('lcs-finanzas'), name: 'finanzas', displayName: 'Finanzas' },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
        }
      })
      localStorage.setItem(FINANZAS_CRED_KEY, JSON.stringify(Array.from(new Uint8Array(cred.rawId))))
      setFinHasCred(true)
      setShowFinBioPrompt(false)
    } catch {
      setShowFinBioPrompt(false)
    }
  }

  const autenticarHuellaFinanzas = async () => {
    setFinBioError(false)
    try {
      const stored = localStorage.getItem(FINANZAS_CRED_KEY)
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
      entrarFinanzas()
    } catch {
      setFinBioError(true)
      setTimeout(() => setFinBioError(false), 2000)
    }
  }

  const abrirTab = t => {
    if (t === 'Finanzas' && !finanzasAuthed) {
      setShowFinanzasPin(true)
      setFinanzasPinInput('')
      setFinanzasPinError(false)
      setFinBioError(false)
      return
    }
    setTab(t)
  }

  return (
    <div className="min-h-screen">

      {/* Modal PIN Finanzas */}
      {showFinanzasPin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-green-800 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-white font-bold text-lg">Finanzas</p>
              <p className="text-gray-400 text-sm">Ingresá el PIN de acceso</p>
            </div>
            <input
              type="password" inputMode="numeric" maxLength={12}
              value={finanzasPinInput} onChange={e => setFinanzasPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && intentarFinanzasPin()}
              placeholder="• • • •"
              className={`w-full bg-[#111] border-2 ${finanzasPinError ? 'border-red-500' : 'border-green-800'} rounded-xl px-4 py-3 text-center text-white text-2xl tracking-[0.3em] outline-none mb-2 transition-colors`}
              autoFocus
            />
            {finanzasPinError && <p className="text-red-400 text-sm text-center mb-2 animate-pulse">PIN incorrecto</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowFinanzasPin(false)} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm">Cancelar</button>
              <button onClick={intentarFinanzasPin} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm">Entrar</button>
            </div>

            {finHasCred && finBioAvail && (
              <button
                onClick={autenticarHuellaFinanzas}
                className="w-full mt-3 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#111] border border-green-900/40 active:scale-95 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 ${finBioError ? 'text-red-400' : 'text-green-400'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                </svg>
                <span className={`text-xs font-semibold ${finBioError ? 'text-red-400' : 'text-green-400'}`}>
                  {finBioError ? 'No se reconoció' : 'Entrar con huella'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal activar huella para Finanzas */}
      {showFinBioPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-green-800 shadow-2xl text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-green-400 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
            </svg>
            <p className="text-white font-bold text-lg">¿Activar huella para Finanzas?</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">La próxima vez entrás sin escribir el PIN</p>
            <div className="flex gap-2">
              <button onClick={() => setShowFinBioPrompt(false)} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm">Ahora no</button>
              <button onClick={registrarHuellaFinanzas} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm">Activar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-3">
        <h1 className="text-xl font-black text-white mb-3">Panel Admin</h1>
        {/* Tabs en 2 renglones si no entran todos */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => abrirTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${tab === t
                  ? (t === 'Finanzas' ? 'bg-red-600 text-white' : 'bg-green-600 text-white')
                  : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-6">
        {tab === 'Equipos'    && <TabEquipos data={data} />}
        {tab === 'Jugadores'  && <TabJugadores data={data} />}
        {tab === 'Partidos'   && <TabPartidos data={data} />}
        {tab === 'Copas'      && <TabCopas data={data} />}
        {tab === 'Resultados' && <TabResultados data={data} />}
        {tab === 'Novedades'  && <TabNovedades data={data} />}
        {tab === 'Finanzas'   && finanzasAuthed && <TabFinanzas data={data} />}
      </div>
    </div>
  )
}

/* ─── EQUIPOS ─── */
function TabEquipos({ data }) {
  const equipos = data.equipos || {}
  const [nombre, setNombre] = useState('')
  const [escudo, setEscudo] = useState(null)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleImagen = async e => {
    const f = e.target.files[0]
    if (!f) return
    setEscudo(await compressImage(f, 300, 0.8))
  }

  const guardar = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    if (editId) {
      const payload = { nombre: nombre.trim() }
      if (escudo !== undefined) payload.escudo = escudo || null
      await update(ref(db, `equipos/${editId}`), payload)
    } else {
      await push(ref(db, 'equipos'), { nombre: nombre.trim(), escudo: escudo || null })
    }
    setNombre(''); setEscudo(null); setEditId(null); setLoading(false)
  }

  const editar = (id, eq) => {
    setEditId(id)
    setNombre(eq.nombre)
    setEscudo(undefined)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => { setEditId(null); setNombre(''); setEscudo(null) }

  const eliminar = async id => {
    if (!confirm('¿Eliminar equipo?')) return
    await remove(ref(db, `equipos/${id}`))
    await remove(ref(db, `jugadores/${id}`))
  }

  const retirar = async (id, retirado) => {
    const msg = retirado ? '¿Reactivar este equipo?' : '¿Retirar este equipo del torneo? No va a contar para generar nuevos partidos, pero sus resultados, goles y tarjetas ya jugados se mantienen.'
    if (!confirm(msg)) return
    await update(ref(db, `equipos/${id}`), { retirado: !retirado })
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Banner de edición */}
      {editId && (
        <div className="bg-green-900/30 border border-green-600/40 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-green-400 text-sm">✏️ Editando:</span>
          <span className="text-white text-sm font-bold">{equipos[editId]?.nombre}</span>
        </div>
      )}

      <div className={`bg-[#1a1a1a] rounded-xl p-4 border space-y-3 ${editId ? 'border-green-600/60' : 'border-green-900/30'}`}>
        <p className="text-sm font-bold text-green-400">{editId ? '✏️ Editar Equipo' : 'Nuevo Equipo'}</p>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del equipo"
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
        <div>
          <p className="text-xs text-gray-500 mb-1">{editId ? 'Nuevo escudo (opcional)' : 'Escudo (opcional)'}</p>
          <input type="file" accept="image/*" onChange={handleImagen} className="text-xs text-gray-400" />
          {escudo && escudo !== undefined && <img src={escudo} className="w-16 h-16 object-contain mt-2 rounded-lg" />}
        </div>
        <div className="flex gap-2">
          {editId && (
            <button onClick={cancelar} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-2.5 text-sm border border-green-900/20">
              Cancelar
            </button>
          )}
          <button onClick={guardar} disabled={loading || !nombre.trim()}
            className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
            {loading ? 'Guardando...' : editId ? 'Actualizar equipo' : 'Agregar equipo'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(equipos).map(([id, eq]) => (
          <div key={id} className={`bg-[#1a1a1a] rounded-xl p-3 border flex items-center gap-3 transition-all
            ${editId === id ? 'border-green-600/50' : eq.retirado ? 'border-red-900/40' : 'border-green-900/20'}`}>
            {eq.escudo
              ? <img src={eq.escudo} className={`w-10 h-10 object-contain rounded-lg flex-shrink-0 ${eq.retirado ? 'opacity-40' : ''}`} />
              : <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center text-xl flex-shrink-0">⚽</div>
            }
            <div className="flex-1 min-w-0">
              <p className={`font-semibold min-w-0 truncate ${eq.retirado ? 'text-gray-500' : 'text-white'}`}>{eq.nombre}</p>
              {eq.retirado && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Retirado</p>}
            </div>
            <button onClick={() => editar(id, eq)}
              className="text-xs bg-green-900/40 text-green-400 border border-green-800/40 rounded-lg px-3 py-1.5 font-medium flex-shrink-0">
              Editar
            </button>
            <button onClick={() => retirar(id, eq.retirado)}
              className={`text-xs rounded-lg px-3 py-1.5 font-medium flex-shrink-0 border ${eq.retirado ? 'bg-green-900/40 text-green-400 border-green-800/40' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40'}`}>
              {eq.retirado ? 'Reactivar' : 'Retirar'}
            </button>
            <button onClick={() => eliminar(id)}
              className="text-xs text-red-400 px-2 py-1 flex-shrink-0">
              Borrar
            </button>
          </div>
        ))}
        {Object.keys(equipos).length === 0 && <p className="text-gray-600 text-sm text-center py-4">Sin equipos</p>}
      </div>
    </div>
  )
}

/* ─── JUGADORES ─── */
function TabJugadores({ data }) {
  const equipos = data.equipos || {}
  const jugadores = data.jugadores || {}
  const [equipoSel, setEquipoSel] = useState('')
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)

  const lista = equipoSel ? Object.entries(jugadores[equipoSel] || {}) : []

  const guardar = async () => {
    if (!equipoSel || !nombre.trim()) return
    setLoading(true)
    if (editId) {
      await update(ref(db, `jugadores/${equipoSel}/${editId}`), { nombre: nombre.trim(), dni: dni.trim(), numero: numero.trim() })
      setEditId(null)
    } else {
      await push(ref(db, `jugadores/${equipoSel}`), { nombre: nombre.trim(), dni: dni.trim(), numero: numero.trim() })
    }
    setNombre(''); setDni(''); setNumero(''); setLoading(false)
  }

  const editar = (id, j) => {
    setEditId(id)
    setNombre(j.nombre || '')
    setDni(j.dni || '')
    setNumero(j.numero || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => { setEditId(null); setNombre(''); setDni(''); setNumero('') }

  const eliminar = async jugId => {
    if (!confirm('¿Eliminar jugador?')) return
    await remove(ref(db, `jugadores/${equipoSel}/${jugId}`))
  }

  return (
    <div className="pt-4 space-y-4">
      <div className={`bg-[#1a1a1a] rounded-xl p-4 border space-y-3 ${editId ? 'border-green-600/60' : 'border-green-900/30'}`}>
        <p className="text-sm font-bold text-green-400">{editId ? '✏️ Editar Jugador' : 'Agregar Jugador'}</p>
        <select value={equipoSel} onChange={e => { setEquipoSel(e.target.value); cancelar() }}
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
          <option value="">— Seleccioná un equipo —</option>
          {Object.entries(equipos).map(([id, eq]) => <option key={id} value={id}>{eq.nombre}</option>)}
        </select>
        {equipoSel && <>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y Apellido"
            className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
          <div className="flex gap-2">
            <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="N° camiseta" inputMode="numeric"
              className="w-28 bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
            <input value={dni} onChange={e => setDni(e.target.value)} placeholder="DNI (opcional)" inputMode="numeric"
              className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            {editId && (
              <button onClick={cancelar} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-2.5 text-sm border border-green-900/20">
                Cancelar
              </button>
            )}
            <button onClick={guardar} disabled={loading || !nombre.trim()}
              className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
              {loading ? 'Guardando...' : editId ? 'Actualizar jugador' : 'Agregar Jugador'}
            </button>
          </div>
        </>}
      </div>

      {equipoSel && (
        <div className="space-y-2">
          <p className="text-xs text-green-400 font-bold uppercase tracking-widest">{equipos[equipoSel]?.nombre} · {lista.length} jugadores</p>
          {lista
            .sort((a, b) => (Number(a[1].numero) || 999) - (Number(b[1].numero) || 999))
            .map(([id, j]) => (
            <div key={id} className={`bg-[#1a1a1a] rounded-xl px-3 py-2.5 border flex items-center gap-2 transition-all ${editId === id ? 'border-green-600/50' : 'border-green-900/20'}`}>
              {j.numero && (
                <span className="w-8 text-center text-sm font-black text-green-400 flex-shrink-0">#{j.numero}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{j.nombre}</p>
                {j.dni && <p className="text-[11px] text-gray-500">DNI: {j.dni}</p>}
              </div>
              <button onClick={() => editar(id, j)}
                className="text-xs bg-green-900/40 text-green-400 border border-green-800/40 rounded-lg px-3 py-1.5 font-medium flex-shrink-0">
                Editar
              </button>
              <button onClick={() => eliminar(id)} className="text-xs text-red-400 px-2 flex-shrink-0">Borrar</button>
            </div>
          ))}
          {lista.length === 0 && <p className="text-gray-600 text-sm text-center py-3">Sin jugadores</p>}
        </div>
      )}
    </div>
  )
}

/* ─── HORARIOS POR FRANJA (2 canchas simultáneas: 14hs, 15hs, 16hs) ─── */
const GAME_SLOTS = [14, 15, 16]

// Reparto al azar, 2 partidos por franja — evita que un equipo quede siempre en el mismo horario
function assignMatchSlots(matches) {
  const res = new Map()
  const shuffled = [...matches].sort(() => Math.random() - 0.5)
  shuffled.forEach((m, i) => res.set(m, GAME_SLOTS[Math.floor(i / 2) % GAME_SLOTS.length]))
  return res
}

/* ─── ROUND ROBIN (Berger determinístico) ─── */
function buildRoundRobin(equiposIds, equipos) {
  // El Mirasol es provisional (solo Fecha 1) → no va al Berger permanente
  const mirId   = equiposIds.find(id => /mirasol/i.test(equipos[id]?.nombre || ''))
  const permIds = equiposIds.filter(id => id !== mirId)

  const find = pat => permIds.find(id => pat.test(equipos[id]?.nombre || ''))
  const romaId   = find(/\broma\b/i)
  const joseFCId = find(/san jose fc/i)                 // San Jose FC (sin restricción)
  const joseId   = find(/^san jose$/i)                  // San Jose original (pos final = rival de La Roma en F1)
  const antiId   = find(/antidoping/i)
  const tucaId   = find(/tuca/i)
  const bandaId  = find(/banda/i)
  const julioId  = find(/\b25\b|julio/i)
  const restoId  = find(/resto/i)
  const pibesId  = find(/pibes|trebol/i)
  const milanId  = find(/milan/i)
  const candId   = find(/candelabro/i)
  const la18Id   = find(/\b18\b/)

  // LaRoma ancla (pos 0), SanJose original al final (pos n-1) → emparejado con LaRoma en F1
  const middle = [la18Id, antiId, tucaId, bandaId, julioId, restoId, joseFCId, pibesId, milanId, candId].filter(Boolean)
  const known  = [romaId, ...middle, joseId].filter(Boolean)
  const rest   = permIds.filter(id => !known.includes(id))
  const last   = known[known.length - 1]
  const ids    = [...known.slice(0, -1), ...rest, last].filter(Boolean)
  if (ids.length % 2 !== 0) ids.push('bye')

  const n = ids.length
  const fixture = {}
  const t = [...ids]
  for (let ronda = 0; ronda < n - 1; ronda++) {
    const matches = []
    for (let i = 0; i < n / 2; i++) {
      const h = t[i], a = t[n - 1 - i]
      if (h !== 'bye' && a !== 'bye') matches.push({ local: h, visitante: a })
    }
    fixture[ronda + 1] = matches
    const lst = t[n - 1]
    for (let j = n - 1; j > 1; j--) t[j] = t[j - 1]
    t[1] = lst
  }
  return fixture
}

/* ─── PARTIDO CARD (usado en TabPartidos) ─── */
function PartidoCard({ p, equipos, jugadores, goles, tarjetas, fechaDia, cerrada }) {
  if (p.libre) {
    const eq = equipos[p.local] || {}
    return (
      <div className="bg-[#1a1a1a] rounded-xl px-4 py-3 border border-yellow-900/30 flex items-center gap-3">
        {eq.escudo && <img src={eq.escudo} className="w-8 h-8 object-contain rounded flex-shrink-0" />}
        <span className="flex-1 text-sm font-semibold text-white">{eq.nombre || '?'}</span>
        <span className="text-xs font-bold text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded-lg">LIBRE</span>
      </div>
    )
  }

  const [gl, setGl] = useState(String(p.golesLocal ?? ''))
  const [gv, setGv] = useState(String(p.golesVisitante ?? ''))
  const [hora, setHora] = useState(p.fechaHora ? p.fechaHora.split('T')[1]?.slice(0, 5) : (p.hora || ''))
  const [saving, setSaving] = useState(false)
  const [horaSaved, setHoraSaved] = useState(false)
  const [showTarj, setShowTarj] = useState(false)
  const [tarjEq, setTarjEq] = useState('')
  const [tarjJug, setTarjJug] = useState('')
  const [tarjTipo, setTarjTipo] = useState('amarilla')
  const [selGol, setSelGol] = useState({ [p.local]: '', [p.visitante]: '' })
  const [quickNames, setQuickNames] = useState({ [p.local]: '', [p.visitante]: '' })

  // Separado: la hora se sincroniza siempre (puede cambiar con "Aplicar a todos")
  // Los goles NO se sincronizan cuando cambia la hora — evita resetear lo que el usuario está escribiendo
  useEffect(() => {
    setHora(p.fechaHora ? p.fechaHora.split('T')[1]?.slice(0, 5) : (p.hora || ''))
  }, [p.fechaHora, p.hora])

  useEffect(() => {
    setGl(String(p.golesLocal ?? ''))
    setGv(String(p.golesVisitante ?? ''))
  }, [p.golesLocal, p.golesVisitante])

  const golesPartido = Object.entries(goles[p.id] || {})
  const tarjetasPartido = Object.entries(tarjetas[p.id] || {})
  const amarillas = tarjetasPartido.filter(([, t]) => t.tipo === 'amarilla').length
  const rojas     = tarjetasPartido.filter(([, t]) => t.tipo === 'roja').length

  // Goles agrupados por jugador → "Juan (x2)"
  const golesAgrupados = Object.values(
    golesPartido.reduce((acc, [gid, g]) => {
      const key = `${g.equipoId}___${g.jugadorId}`
      if (!acc[key]) acc[key] = { equipoId: g.equipoId, jugadorId: g.jugadorId, ids: [], count: 0 }
      acc[key].ids.push(gid)
      acc[key].count++
      return acc
    }, {})
  )

  const jugsPorEquipo = id =>
    Object.entries(jugadores[id] || {})
      .map(([jid, j]) => ({ jid, nombre: j.nombre, numero: j.numero || '' }))
      .sort((a, b) => (Number(a.numero) || 999) - (Number(b.numero) || 999) || a.nombre.localeCompare(b.nombre))

  const guardarHora = () => {
    const dia = fechaDia || (p.fechaHora ? p.fechaHora.split('T')[0] : null)
    update(ref(db, `partidos/${p.id}`), {
      hora: hora || null,
      fechaHora: (dia && hora) ? `${dia}T${hora}` : null,
    })
    setHoraSaved(true)
  }

  const guardarResultado = async () => {
    if (gl === '' || gv === '') return
    setSaving(true)
    await update(ref(db, `partidos/${p.id}`), { golesLocal: Number(gl), golesVisitante: Number(gv), jugado: true })
    setSaving(false)
  }

  // Un toque en el botón del jugador = +1 gol
  const tapGol = (equipoId, jugadorId) =>
    push(ref(db, `goles/${p.id}`), { equipoId, jugadorId, enContra: false })

  // Quitar UN gol del jugador (el último registrado)
  const quitarGol = (ids) => remove(ref(db, `goles/${p.id}/${ids[ids.length - 1]}`))

  // Entrada rápida: crea jugador si no existe y suma gol
  const addGoalManual = async (eqId) => {
    const nombre = quickNames[eqId]?.trim()
    if (!nombre) return
    const existente = Object.entries(jugadores[eqId] || {})
      .find(([, j]) => j.nombre.toLowerCase() === nombre.toLowerCase())
    let jugadorId
    if (existente) {
      jugadorId = existente[0]
    } else {
      const nuevo = await push(ref(db, `jugadores/${eqId}`), { nombre })
      jugadorId = nuevo.key
    }
    await push(ref(db, `goles/${p.id}`), { equipoId: eqId, jugadorId, enContra: false })
    setQuickNames(prev => ({ ...prev, [eqId]: '' }))
  }

  const agregarTarjeta = async () => {
    if (!tarjEq || !tarjJug) return
    await push(ref(db, `tarjetas/${p.id}`), { equipoId: tarjEq, jugadorId: tarjJug, tipo: tarjTipo })
    setTarjEq(''); setTarjJug(''); setTarjTipo('amarilla')
  }

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${p.jugado ? 'border-green-700/50 bg-[#1a1a1a]' : 'border-green-900/20 bg-[#1a1a1a]'}`}>

      {/* Header: equipos + resultado */}
      <div className={`px-3 py-2.5 ${p.jugado ? 'bg-green-900/20' : ''}`}>
        {/* Nombre y escudos */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
            {equipos[p.local]?.escudo && <img src={equipos[p.local].escudo} className="w-8 h-8 object-contain rounded flex-shrink-0" />}
            <span className="text-sm font-bold text-white truncate">{equipos[p.local]?.nombre || '?'}</span>
          </div>
          {/* Marcador grande */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <input type="number" min="0" value={gl} onChange={e => setGl(e.target.value)} disabled={cerrada}
              className="w-10 bg-[#111] border border-green-900/30 rounded-lg text-white text-xl font-black text-center outline-none py-1 disabled:opacity-50" />
            <span className="text-gray-600 font-black text-lg">-</span>
            <input type="number" min="0" value={gv} onChange={e => setGv(e.target.value)} disabled={cerrada}
              className="w-10 bg-[#111] border border-green-900/30 rounded-lg text-white text-xl font-black text-center outline-none py-1 disabled:opacity-50" />
            {!cerrada && (
              <button onClick={guardarResultado}
                className="bg-green-600 text-white rounded-lg w-9 h-9 text-sm font-black flex items-center justify-center ml-1">
                {saving ? '⏳' : '✓'}
              </button>
            )}
          </div>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {equipos[p.visitante]?.escudo && <img src={equipos[p.visitante].escudo} className="w-8 h-8 object-contain rounded flex-shrink-0" />}
            <span className="text-sm font-bold text-white truncate">{equipos[p.visitante]?.nombre || '?'}</span>
          </div>
        </div>

        {/* Solo hora */}
        {!cerrada && (
          <div className="flex gap-2">
            <input type="time" value={hora} onChange={e => { setHora(e.target.value); setHoraSaved(false) }}
              className="flex-1 bg-[#111] border border-green-900/30 rounded-lg px-3 py-1.5 text-white text-sm outline-none" />
            <button onClick={guardarHora} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${horaSaved ? 'bg-green-600 text-white border border-green-600' : 'bg-[#222] border border-green-900/30 text-green-400'}`}>✓</button>
          </div>
        )}
      </div>

      {/* Goleadores — 2 columnas por equipo */}
      <div className="px-3 py-2 border-t border-green-900/10">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">⚽ Goleadores</p>
        <div className="grid grid-cols-2 gap-2">
          {[p.local, p.visitante].map((eqId, colIdx) => {
            const jugs = jugsPorEquipo(eqId)
            const chipsEquipo = golesAgrupados.filter(g => g.equipoId === eqId)
            const isRight = colIdx === 1
            return (
              <div key={eqId} className="space-y-1.5">
                <p className={`text-[10px] font-bold text-green-400 truncate ${isRight ? 'text-right' : ''}`}>
                  {equipos[eqId]?.nombre}
                </p>

                {/* Chips del equipo */}
                {chipsEquipo.length > 0 && (
                  <div className={`flex flex-wrap gap-1 ${isRight ? 'justify-end' : ''}`}>
                    {chipsEquipo.map(g => {
                      const jug = jugadores[g.equipoId]?.[g.jugadorId]
                      return (
                        <div key={`${g.equipoId}___${g.jugadorId}`}
                          className="flex items-center gap-1 bg-green-900/30 border border-green-700/30 rounded-full px-2 py-0.5">
                          <span className="text-green-300 text-[11px] font-semibold">
                            {jug?.numero && <span className="text-green-500">#{jug.numero} </span>}
                            {jug?.nombre?.split(' ')[0] || '?'}
                            {g.count > 1 && <span className="text-green-500 ml-0.5 font-black">x{g.count}</span>}
                          </span>
                          {!cerrada && (
                            <button onClick={() => quitarGol(g.ids)} className="text-red-400 text-[10px] leading-none ml-0.5">✕</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Select jugador registrado */}
                {!cerrada && jugs.length > 0 && (
                  <div className="flex gap-1">
                    <select
                      value={selGol[eqId] || ''}
                      onChange={e => setSelGol(prev => ({ ...prev, [eqId]: e.target.value }))}
                      className="flex-1 bg-[#111] border border-green-900/30 rounded-lg px-1.5 py-1.5 text-white text-[11px] outline-none min-w-0"
                    >
                      <option value="">Jugador</option>
                      {jugs.map(j => <option key={j.jid} value={j.jid}>{j.numero ? `#${j.numero} · ${j.nombre}` : j.nombre}</option>)}
                    </select>
                    <button
                      onClick={() => selGol[eqId] && tapGol(eqId, selGol[eqId])}
                      disabled={!selGol[eqId]}
                      className="bg-green-700 text-white rounded-lg px-2 text-xs font-black disabled:opacity-30 flex-shrink-0"
                    >⚽</button>
                  </div>
                )}

                {/* Entrada rápida */}
                {!cerrada && (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder={jugs.length > 0 ? '+ Nuevo' : '+ Jugador'}
                      value={quickNames[eqId] || ''}
                      onChange={e => setQuickNames(prev => ({ ...prev, [eqId]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addGoalManual(eqId)}
                      className="flex-1 bg-[#111] border border-green-900/40 rounded-lg px-2 py-1.5 text-white text-[11px] outline-none placeholder:text-gray-700 min-w-0"
                    />
                    <button
                      onClick={() => addGoalManual(eqId)}
                      disabled={!quickNames[eqId]?.trim()}
                      className="bg-green-700/60 text-white rounded-lg px-2 text-xs font-black disabled:opacity-30 flex-shrink-0"
                    >⚽</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tarjetas (collapsible) */}
      <div className="px-3 pb-3 border-t border-green-900/10 pt-2">
        <button onClick={() => setShowTarj(!showTarj)}
          className="w-full flex items-center justify-between bg-[#111] rounded-lg px-3 py-2 text-xs">
          <span className="text-gray-400">
            🟨🟥 Tarjetas
            {amarillas > 0 && <span className="ml-2 text-yellow-400 font-bold">{amarillas}</span>}
            {rojas > 0 && <span className="ml-2 text-red-400 font-bold">{rojas}</span>}
            {amarillas === 0 && rojas === 0 && <span className="text-gray-600 ml-1">— sin tarjetas</span>}
          </span>
          <span className="text-green-500 text-[10px]">{showTarj ? '▲' : '▼'}</span>
        </button>

        {showTarj && (
          <div className="mt-2 space-y-2">
            {tarjetasPartido.map(([tid, t]) => {
              const jug = jugadores[t.equipoId]?.[t.jugadorId]
              return (
                <div key={tid} className="flex items-center gap-2 text-xs bg-[#222] rounded-lg px-2.5 py-1.5">
                  <span>{t.tipo === 'amarilla' ? '🟨' : '🟥'}</span>
                  <span className="flex-1 text-gray-300 truncate">
                    {jug?.numero && <span className="text-green-500">#{jug.numero} </span>}
                    {jug?.nombre || '?'}
                    <span className="text-gray-500 ml-1">· {equipos[t.equipoId]?.nombre}</span>
                  </span>
                  {!cerrada && (
                    <button onClick={() => remove(ref(db, `tarjetas/${p.id}/${tid}`))} className="text-red-400 flex-shrink-0">✕</button>
                  )}
                </div>
              )
            })}

            {/* Agregar tarjeta */}
            {!cerrada && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  <select value={tarjEq} onChange={e => { setTarjEq(e.target.value); setTarjJug('') }}
                    className="flex-1 bg-[#111] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none">
                    <option value="">Equipo</option>
                    {[p.local, p.visitante].map(id => (
                      <option key={id} value={id}>{equipos[id]?.nombre || id}</option>
                    ))}
                  </select>
                  <select value={tarjTipo} onChange={e => setTarjTipo(e.target.value)}
                    className="bg-[#111] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none">
                    <option value="amarilla">🟨 Amarilla</option>
                    <option value="roja">🟥 Roja</option>
                  </select>
                </div>
                <div className="flex gap-1.5">
                  <select value={tarjJug} onChange={e => setTarjJug(e.target.value)}
                    className="flex-1 bg-[#111] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none">
                    <option value="">Jugador</option>
                    {jugsPorEquipo(tarjEq).map(j => <option key={j.jid} value={j.jid}>{j.numero ? `#${j.numero} · ${j.nombre}` : j.nombre}</option>)}
                  </select>
                  <button onClick={agregarTarjeta} disabled={!tarjEq || !tarjJug}
                    className="bg-yellow-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 flex-shrink-0">
                    + Tarjeta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {p.jugado && (
        <div className="bg-green-900/20 px-3 py-1 flex items-center justify-between">
          <span className="text-[11px] text-green-400">✓ Resultado guardado: {p.golesLocal} - {p.golesVisitante}</span>
          {cerrada && <span className="text-[10px] text-gray-500 font-bold">🔒 CERRADA</span>}
        </div>
      )}
    </div>
  )
}

/* ─── PARTIDOS ─── */
function TabPartidos({ data }) {
  const equipos = data.equipos || {}
  const equiposActivos = Object.fromEntries(Object.entries(equipos).filter(([, eq]) => !eq.retirado))
  const partidos = data.partidos || {}
  const jugadores = data.jugadores || {}
  const goles = data.goles || {}
  const tarjetas = data.tarjetas || {}
  const masterFixture = data.master_fixture || null
  const homeFecha = data.home_fecha || null
  const fechasCerradas = data.fechas_cerradas || {}

  const cantEquipos = Object.keys(equiposActivos).length
  const totalFechas = cantEquipos > 1 ? (cantEquipos % 2 === 0 ? cantEquipos - 1 : cantEquipos) : 9

  const [fechaSel, setFechaSel] = useState(1)
  const [fechaDia, setFechaDia] = useState('')
  const [generando, setGenerando] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [suspendidos, setSuspendidos] = useState(new Set())
  const [showManual, setShowManual] = useState(false)
  const [manualLocal, setManualLocal] = useState('')
  const [manualVisitante, setManualVisitante] = useState('')
  const [manualHora, setManualHora] = useState('14:00')
  const [agregando, setAgregando] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [showConfirmBorrar, setShowConfirmBorrar] = useState(false)
  const dateInputRef = useRef(null)
  const fechaInicializada = useRef(false)

  // Al cargar, abrir directo en la fecha en curso: la primera que todavía no está cerrada
  useEffect(() => {
    if (fechaInicializada.current) return
    const numeros = [...new Set(Object.values(partidos).filter(p => p.fase === 'liga').map(p => p.numero))].sort((a, b) => a - b)
    if (numeros.length > 0) {
      const enCurso = numeros.find(n => !fechasCerradas[n])
      setFechaSel(enCurso ?? numeros[numeros.length - 1])
      fechaInicializada.current = true
    }
  }, [partidos, fechasCerradas])

  const cerrada = !!fechasCerradas[fechaSel]

  const toggleCerrada = () => {
    const msg = cerrada ? '¿Reabrir esta fecha para poder editar resultados?' : '¿Cerrar esta fecha? Los resultados, goles y tarjetas quedan bloqueados y no se van a poder editar hasta reabrirla.'
    if (!confirm(msg)) return
    set(ref(db, `fechas_cerradas/${fechaSel}`), cerrada ? null : true)
  }

  const toggleSuspendido = id => setSuspendidos(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  useEffect(() => {
    const dias = [...new Set(
      Object.values(partidos)
        .filter(p => p.fase === 'liga' && Number(p.numero) === fechaSel && p.fechaHora)
        .map(p => p.fechaHora.split('T')[0])
    )]
    setFechaDia(dias.length === 1 ? dias[0] : '')
  }, [fechaSel])

  const horaDe = p => {
    const t = p.fechaHora ? p.fechaHora.split('T')[1]?.slice(0, 5) : p.hora
    return t ? Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) : Infinity
  }

  const partidosFecha = Object.entries(partidos)
    .filter(([, p]) => p.fase === 'liga' && p.numero === fechaSel)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => horaDe(a) - horaDe(b) || a.id.localeCompare(b.id))

  const fmtDia = iso => {
    if (!iso) return null
    const [y, m, d] = iso.split('-')
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const fecha = new Date(`${iso}T12:00`)
    return `${dias[fecha.getDay()]} ${d}/${m}/${y}`
  }

  const aplicarFechaATodos = async () => {
    if (!fechaDia || partidosFecha.length === 0) return
    for (const partido of partidosFecha) {
      const horaExist = partido.fechaHora ? partido.fechaHora.split('T')[1]?.slice(0, 5) : (partido.hora || '00:00')
      await update(ref(db, `partidos/${partido.id}`), { fechaHora: `${fechaDia}T${horaExist}` })
    }
  }

  const generarFecha = async () => {
    if (cantEquipos < 2) return alert('Necesitás al menos 2 equipos')
    const yaExiste = partidosFecha.length > 0
    if (yaExiste && !confirm(`La Fecha ${fechaSel} ya tiene partidos. ¿Reemplazarlos?`)) return
    setGenerando(true)
    let fixture = masterFixture
    if (!fixture) {
      fixture = buildRoundRobin(Object.keys(equiposActivos), equipos)
      await set(ref(db, 'master_fixture'), fixture)
    }
    for (const [id, p] of Object.entries(partidos)) {
      if (p.fase === 'liga' && p.numero === fechaSel) {
        await remove(ref(db, `partidos/${id}`))
        await remove(ref(db, `goles/${id}`))
        await remove(ref(db, `tarjetas/${id}`))
      }
    }
    const ronda = fixture[fechaSel] || []
    let arr = Array.isArray(ronda) ? [...ronda] : [...Object.values(ronda)]
    // Equipos retirados → ya no juegan más; sus rivales ("huérfanos") se emparejan entre sí
    const retirados = new Set(Object.entries(equipos).filter(([, eq]) => eq.retirado).map(([id]) => id))
    if (retirados.size > 0) {
      const huerfanos = []
      arr = arr.filter(m => {
        const localRet = retirados.has(m.local)
        const visitRet = retirados.has(m.visitante)
        if (localRet && visitRet) return false
        if (localRet) { huerfanos.push(m.visitante); return false }
        if (visitRet) { huerfanos.push(m.local); return false }
        return true
      })
      while (huerfanos.length >= 2) {
        arr.push({ local: huerfanos.shift(), visitante: huerfanos.shift() })
      }
      if (huerfanos.length === 1) {
        arr.push({ local: huerfanos[0], visitante: null, libre: true })
      }
    }
    // Equipos suspendidos → su rival queda LIBRE
    if (suspendidos.size > 0) {
      arr = arr.map(m => {
        const localSusp = suspendidos.has(m.local)
        const visitSusp = suspendidos.has(m.visitante)
        if (localSusp && visitSusp) return null
        if (localSusp) return { local: m.visitante, visitante: null, libre: true }
        if (visitSusp) return { local: m.local, visitante: null, libre: true }
        return m
      }).filter(Boolean)
    }
    // Fecha 1: La Roma LIBRE; su rival Berger (San Jose) juega con El Mirasol (provisorio)
    if (fechaSel === 1) {
      const romaIdF1 = Object.entries(equipos).find(([, e]) => /\broma\b/i.test(e.nombre || ''))?.[0]
      const mirIdF1  = Object.entries(equipos).find(([, e]) => /mirasol/i.test(e.nombre || ''))?.[0]
      if (romaIdF1) {
        const romaMtch = arr.find(m => m.local === romaIdF1 || m.visitante === romaIdF1)
        const romaOpp  = romaMtch ? (romaMtch.local === romaIdF1 ? romaMtch.visitante : romaMtch.local) : null
        arr = arr.filter(m => m.local !== romaIdF1 && m.visitante !== romaIdF1)
        arr.push({ local: romaIdF1, visitante: null, libre: true })
        if (romaOpp) {
          if (mirIdF1) arr.push({ local: romaOpp, visitante: mirIdF1 })
          else         arr.push({ local: romaOpp, visitante: null, libre: true })
        }
      }
    }
    // Separar LIBRE de activos y asignar franjas horarias automáticas
    const libres  = arr.filter(m => m.libre)
    const activos = arr.filter(m => !m.libre)
    const slotMap = assignMatchSlots(activos)
    const activosSorted = [...activos].sort((a, b) => (slotMap.get(a) ?? 14) - (slotMap.get(b) ?? 14))
    for (const m of activosSorted) {
      const slot = slotMap.get(m) ?? 14
      const hs = `${String(slot).padStart(2, '0')}:00`
      await push(ref(db, 'partidos'), {
        numero: fechaSel, fase: 'liga',
        local: m.local, visitante: m.visitante,
        libre: false, hora: hs,
        fechaHora: fechaDia ? `${fechaDia}T${hs}` : null,
        jugado: false, golesLocal: null, golesVisitante: null,
      })
    }
    for (const m of libres) {
      await push(ref(db, 'partidos'), {
        numero: fechaSel, fase: 'liga',
        local: m.local, visitante: null,
        libre: true, hora: null, fechaHora: null,
        jugado: false, golesLocal: null, golesVisitante: null,
      })
    }
    setSuspendidos(new Set())
    setGenerando(false)
  }

  const publicarEnHome = async () => {
    setPublicando(true)
    await set(ref(db, 'home_fecha'), fechaSel)
    setPublicando(false)
  }

  const quitarDeHome = () => set(ref(db, 'home_fecha'), null)

  const descargarFixture = async () => {
    if (!partidosFecha.length) return
    setDescargando(true)
    const W = 1080, PAD = 48, INNER = W - PAD * 2
    const rr = (ctx, x, y, w, h, r) => {
      ctx.beginPath()
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
    }
    const trunc = (ctx, txt, max) => {
      if (ctx.measureText(txt).width <= max) return txt
      let t = txt
      while (ctx.measureText(t+'…').width > max && t.length > 1) t = t.slice(0,-1)
      return t+'…'
    }
    // cargar escudos
    const imgs = {}
    await Promise.all(Object.entries(equipos).map(([id,eq]) => {
      if (!eq.escudo) return Promise.resolve()
      return new Promise(res => {
        const i = new Image(); i.onload=()=>{imgs[id]=i;res()}; i.onerror=res; i.src=eq.escudo
      })
    }))
    // agrupar por hora
    const slotOrder = ['14:00','15:00','16:00']
    const bySlot = {}, libres = []
    const sorted = [...partidosFecha].sort((a,b)=>{
      const ha=a.fechaHora?a.fechaHora.split('T')[1]?.slice(0,5):(a.hora||'99:99')
      const hb=b.fechaHora?b.fechaHora.split('T')[1]?.slice(0,5):(b.hora||'99:99')
      return ha.localeCompare(hb)
    })
    for (const p of sorted) {
      if (p.libre){libres.push(p);continue}
      const h=p.fechaHora?p.fechaHora.split('T')[1]?.slice(0,5):(p.hora||'S/H')
      if(!bySlot[h])bySlot[h]=[]
      bySlot[h].push(p)
    }
    const allSlots=[...slotOrder.filter(s=>bySlot[s]),...Object.keys(bySlot).filter(s=>!slotOrder.includes(s)).sort()]
    // alturas
    const HDR=190, PILL=62, MATCH=148, LIBRE_H=70, GAP=14, FTR=72
    let totalH = HDR
    for(const s of allSlots) totalH += PILL + bySlot[s].length*MATCH + GAP
    if(libres.length) totalH += PILL + libres.length*LIBRE_H + GAP
    totalH += FTR
    // canvas
    const canvas = document.createElement('canvas')
    canvas.width=W; canvas.height=totalH
    const ctx = canvas.getContext('2d')
    // fondo
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,0,W,totalH)
    const g=ctx.createLinearGradient(0,0,0,HDR)
    g.addColorStop(0,'#052e16'); g.addColorStop(1,'#0a0a0a')
    ctx.fillStyle=g; ctx.fillRect(0,0,W,HDR)
    // header
    ctx.textAlign='center'
    ctx.fillStyle='#16a34a'; ctx.font='bold 18px Arial'
    ctx.fillText('1ª EDICIÓN 2026',W/2,44)
    ctx.fillStyle='#ffffff'; ctx.font='bold 42px Arial'
    ctx.fillText('LIGA CENTRAL SUR',W/2,98)
    ctx.fillStyle='#16a34a'; ctx.font='bold 56px Arial'
    ctx.fillText(`FECHA ${fechaSel}`,W/2,158)
    if(fechaDia){
      ctx.fillStyle='#9ca3af'; ctx.font='22px Arial'
      ctx.fillText(fmtDia(fechaDia),W/2,186)
    }
    ctx.strokeStyle='#16a34a55'; ctx.lineWidth=1
    ctx.beginPath(); ctx.moveTo(PAD,HDR-8); ctx.lineTo(W-PAD,HDR-8); ctx.stroke()
    let y=HDR+GAP
    // slots
    for(const slot of allSlots){
      ctx.fillStyle='#16a34a'; rr(ctx,PAD,y,INNER,PILL,14); ctx.fill()
      ctx.fillStyle='#ffffff'; ctx.font='bold 28px Arial'; ctx.textAlign='center'
      ctx.fillText(`${slot} hs`,W/2,y+PILL/2+10)
      y+=PILL+8
      for(const p of bySlot[slot]){
        const eqL=equipos[p.local]||{}, eqV=equipos[p.visitante]||{}
        ctx.fillStyle='#1a1a1a'; rr(ctx,PAD,y,INNER,MATCH-8,12); ctx.fill()
        ctx.strokeStyle='#16a34a44'; ctx.lineWidth=1; rr(ctx,PAD,y,INNER,MATCH-8,12); ctx.stroke()
        const cy=y+(MATCH-8)/2
        const ESC=70, ESCX=PAD+14
        if(imgs[p.local]) ctx.drawImage(imgs[p.local],ESCX,cy-ESC/2,ESC,ESC)
        if(imgs[p.visitante]) ctx.drawImage(imgs[p.visitante],W-PAD-14-ESC,cy-ESC/2,ESC,ESC)
        const MX=INNER/2-120
        ctx.fillStyle='#ffffff'; ctx.font='bold 32px Arial'
        ctx.textAlign='right'
        ctx.fillText(trunc(ctx,eqL.nombre||'?',MX),W/2-56,cy+11)
        ctx.textAlign='left'
        ctx.fillText(trunc(ctx,eqV.nombre||'?',MX),W/2+56,cy+11)
        ctx.fillStyle='#4b5563'; ctx.font='bold 20px Arial'; ctx.textAlign='center'
        ctx.fillText('VS',W/2,cy+9)
        y+=MATCH
      }
      y+=GAP
    }
    // libres
    if(libres.length){
      ctx.fillStyle='#78350f'; rr(ctx,PAD,y,INNER,PILL,14); ctx.fill()
      ctx.fillStyle='#fbbf24'; ctx.font='bold 26px Arial'; ctx.textAlign='center'
      ctx.fillText('LIBRE',W/2,y+PILL/2+10)
      y+=PILL+8
      for(const p of libres){
        const eq=equipos[p.local]||{}
        ctx.fillStyle='#1a1a1a'; rr(ctx,PAD,y,INNER,LIBRE_H-8,12); ctx.fill()
        ctx.strokeStyle='#78350f55'; ctx.lineWidth=1; rr(ctx,PAD,y,INNER,LIBRE_H-8,12); ctx.stroke()
        if(imgs[p.local]) ctx.drawImage(imgs[p.local],PAD+14,y+(LIBRE_H-8)/2-21,42,42)
        ctx.fillStyle='#fbbf24'; ctx.font='bold 22px Arial'; ctx.textAlign='center'
        ctx.fillText((eq.nombre||'?')+' — sin rival esta fecha',W/2,y+(LIBRE_H-8)/2+8)
        y+=LIBRE_H
      }
      y+=GAP
    }
    // footer
    ctx.fillStyle='#374151'; ctx.font='18px Arial'; ctx.textAlign='center'
    ctx.fillText('ligacentralsur-30b99.web.app',W/2,y+40)
    // descargar
    const url=canvas.toDataURL('image/png')
    const a=document.createElement('a')
    a.href=url; a.download=`LCS-Fecha${fechaSel}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setDescargando(false)
  }

  const agregarManual = async () => {
    if (!manualLocal) return alert('Elegí el equipo local')
    if (!manualVisitante) return alert('Elegí el visitante (o LIBRE)')
    if (manualLocal === manualVisitante) return alert('Local y visitante no pueden ser el mismo')
    setAgregando(true)
    const esLibre = manualVisitante === '__libre__'
    await push(ref(db, 'partidos'), {
      numero: fechaSel, fase: 'liga',
      local: manualLocal,
      visitante: esLibre ? null : manualVisitante,
      libre: esLibre,
      hora: esLibre ? null : manualHora,
      fechaHora: (!esLibre && fechaDia) ? `${fechaDia}T${manualHora}` : null,
      jugado: false, golesLocal: null, golesVisitante: null,
    })
    setManualLocal('')
    setManualVisitante('')
    setManualHora('14:00')
    setAgregando(false)
  }

  const eliminarFecha = async () => {
    setShowConfirmBorrar(false)
    for (const p of partidosFecha) {
      await remove(ref(db, `partidos/${p.id}`))
      await remove(ref(db, `goles/${p.id}`))
      await remove(ref(db, `tarjetas/${p.id}`))
    }
    if (homeFecha === fechaSel) await set(ref(db, 'home_fecha'), null)
  }

  return (
    <div className="pt-4 space-y-4">

      {/* Modal confirmar borrado de fecha */}
      {showConfirmBorrar && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-xs border border-red-800 shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-white font-bold text-lg">¿Borrar Fecha {fechaSel}?</p>
              <p className="text-gray-400 text-sm mt-1">Realmente querés borrar esta fecha. Se van a eliminar los partidos, goles y tarjetas de la Fecha {fechaSel}. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmBorrar(false)} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-3 font-medium text-sm">Cancelar</button>
              <button onClick={eliminarFecha} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold text-sm">Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-600/40 space-y-3">

        {/* Fecha del torneo */}
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Fecha del torneo</p>
          <select
            value={fechaSel}
            onChange={e => setFechaSel(Number(e.target.value))}
            className="w-full bg-[#111] border border-green-600/30 rounded-xl px-4 py-3 text-white text-base font-bold outline-none"
          >
            {Array.from({ length: totalFechas }, (_, i) => i + 1).map(n => {
              const tiene = Object.values(partidos).some(p => p.fase === 'liga' && p.numero === n)
              return <option key={n} value={n}>Fecha {n}{tiene ? '  ✓' : ''}</option>
            })}
          </select>
        </div>

        {/* Día de partidos — botón que abre calendario nativo */}
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Día de los partidos</p>
          <div className="relative">
            <button
              className="w-full bg-[#111] border border-green-600/30 rounded-xl px-4 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
              onClick={() => dateInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-green-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className={`flex-1 text-sm font-semibold ${fechaDia ? 'text-white' : 'text-gray-500'}`}>
                {fechaDia ? fmtDia(fechaDia) : 'Tocar para elegir fecha'}
              </span>
              {fechaDia && (
                <span
                  onClick={e => { e.stopPropagation(); setFechaDia('') }}
                  className="text-gray-500 text-base px-1"
                >✕</span>
              )}
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={fechaDia}
              onChange={e => setFechaDia(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Equipos suspendidos esta fecha */}
        <div>
          <p className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wider">Suspendidos esta fecha</p>
          <div className="space-y-1.5">
            {Object.entries(equiposActivos).map(([id, eq]) => {
              const susp = suspendidos.has(id)
              return (
                <label key={id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${susp ? 'bg-red-900/20 border border-red-900/40' : 'bg-[#111] border border-green-900/10'}`}>
                  <input type="checkbox" checked={susp} onChange={() => toggleSuspendido(id)} className="accent-red-500 w-4 h-4 flex-shrink-0" />
                  {eq.escudo && <img src={eq.escudo} className="w-6 h-6 object-contain rounded flex-shrink-0" />}
                  <span className={`text-sm font-medium flex-1 ${susp ? 'text-red-400 line-through' : 'text-white'}`}>{eq.nombre}</span>
                  {susp && <span className="text-[10px] text-red-400 font-bold">SUSPENDIDO</span>}
                </label>
              )
            })}
          </div>
        </div>

        {/* Aviso fecha cerrada */}
        {cerrada && (
          <div className="bg-gray-900/40 border border-gray-700/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <p className="flex-1 text-xs text-gray-400">Esta fecha está <span className="font-bold text-gray-300">cerrada</span>. Los resultados, goles y tarjetas no se pueden editar.</p>
          </div>
        )}

        {/* Botón Generar */}
        {!cerrada && (
          <button
            onClick={generarFecha}
            disabled={generando || cantEquipos < 2}
            className="w-full bg-green-600 text-white rounded-xl py-3.5 text-base font-bold disabled:opacity-40 active:scale-95 transition-all"
          >
            {generando ? '⏳ Generando...' : `🎲 Generar Fecha ${fechaSel}`}
          </button>
        )}

        {/* Agregar partido manualmente */}
        {!cerrada && (
        <div className="border border-dashed border-green-900/40 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowManual(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-400 active:scale-[0.98] transition-all"
          >
            <span>✏️ Agregar partido manual</span>
            <span className="text-lg leading-none">{showManual ? '▲' : '▼'}</span>
          </button>
          {showManual && (
            <div className="px-4 pb-4 space-y-3 border-t border-green-900/20">
              <div className="grid grid-cols-2 gap-2 pt-3">
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Local</p>
                  <select
                    value={manualLocal}
                    onChange={e => setManualLocal(e.target.value)}
                    className="w-full bg-[#111] border border-green-600/30 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="">— elegir —</option>
                    {Object.entries(equiposActivos)
                      .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))
                      .map(([id, eq]) => <option key={id} value={id}>{eq.nombre}</option>)
                    }
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Visitante</p>
                  <select
                    value={manualVisitante}
                    onChange={e => setManualVisitante(e.target.value)}
                    className="w-full bg-[#111] border border-green-600/30 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="">— elegir —</option>
                    <option value="__libre__">LIBRE (sin rival)</option>
                    {Object.entries(equiposActivos)
                      .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))
                      .filter(([id]) => id !== manualLocal)
                      .map(([id, eq]) => <option key={id} value={id}>{eq.nombre}</option>)
                    }
                  </select>
                </div>
              </div>
              {manualVisitante && manualVisitante !== '__libre__' && (
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Horario</p>
                  <div className="flex gap-2">
                    {['14:00', '15:00', '16:00'].map(h => (
                      <button
                        key={h}
                        onClick={() => setManualHora(h)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${manualHora === h ? 'bg-green-600 text-white' : 'bg-[#111] border border-green-900/30 text-gray-400'}`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={agregarManual}
                disabled={agregando || !manualLocal || !manualVisitante}
                className="w-full bg-green-700 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
              >
                {agregando ? 'Agregando...' : '➕ Agregar partido'}
              </button>
            </div>
          )}
        </div>
        )}

        {/* Aplicar fecha a partidos ya creados */}
        {!cerrada && partidosFecha.length > 0 && fechaDia && (
          <button
            onClick={aplicarFechaATodos}
            className="w-full bg-[#111] border border-green-700/30 text-green-400 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all"
          >
            📅 Aplicar {fmtDia(fechaDia)} a todos
          </button>
        )}

        {cantEquipos < 2 && (
          <p className="text-[11px] text-yellow-600 text-center">Necesitás al menos 2 equipos registrados</p>
        )}
        {!masterFixture && cantEquipos >= 2 && (
          <p className="text-[11px] text-gray-500 text-center">Primera vez: se crea el fixture completo para todas las fechas</p>
        )}
      </div>

      {/* Lista de partidos */}
      {partidosFecha.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-green-400 uppercase tracking-widest">
              Fecha {fechaSel} · {partidosFecha.length} partidos
            </p>
            <div className="flex items-center gap-3">
              <button onClick={toggleCerrada} className={`text-[11px] font-bold ${cerrada ? 'text-green-400' : 'text-gray-400'}`}>
                {cerrada ? '🔓 Reabrir' : '🔒 Cerrar fecha'}
              </button>
              {!cerrada && (
                <button onClick={() => setShowConfirmBorrar(true)} className="text-[11px] text-red-400">Borrar fecha</button>
              )}
            </div>
          </div>

          {partidosFecha.map(p => (
            <PartidoCard
              key={p.id}
              p={p}
              equipos={equipos}
              jugadores={jugadores}
              goles={goles}
              tarjetas={tarjetas}
              fechaDia={fechaDia}
              cerrada={cerrada}
            />
          ))}

          <button onClick={publicarEnHome} disabled={publicando}
            className="w-full bg-green-500 text-black font-bold rounded-xl py-3 text-sm disabled:opacity-40 active:scale-95 transition-all">
            {publicando ? 'Publicando...' : `📢 Publicar Fecha ${fechaSel} en Inicio`}
          </button>
          {homeFecha === fechaSel && (
            <div className="flex items-center justify-between bg-green-900/20 rounded-xl px-3 py-2">
              <p className="text-xs text-green-400">✅ Fecha {fechaSel} publicada en Inicio</p>
              <button onClick={quitarDeHome} className="text-xs text-gray-500 underline">Quitar</button>
            </div>
          )}
          <button onClick={descargarFixture} disabled={descargando}
            className="w-full bg-[#111] border border-green-700/40 text-green-400 font-bold rounded-xl py-3 text-sm disabled:opacity-40 active:scale-95 transition-all">
            {descargando ? '⏳ Generando imagen...' : `📥 Descargar Fecha ${fechaSel}`}
          </button>
        </div>
      )}

      {partidosFecha.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-8">
          Elegí una fecha, el día, y tocá "Generar"
        </p>
      )}
    </div>
  )
}

/* ─── COPAS ─── */
function TabCopas({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const copasEquipos = data.copas_equipos || {}

  const [copa, setCopa] = useState('oro')
  const [addEq, setAddEq] = useState('')
  const [gen, setGen] = useState(false)

  const COPAS = [
    { id: 'oro',    label: 'Copa Oro',    icon: '🥇' },
    { id: 'plata',  label: 'Copa Plata',  icon: '🥈' },
    { id: 'bronce', label: 'Copa Bronce', icon: '🥉' },
  ]

  const RONDAS = {
    oro:    [
      { fase: 'oro_4tos',  label: '4tos de Final', minEq: 4 },
      { fase: 'oro_semi',  label: 'Semifinales',   minEq: 2 },
      { fase: 'oro_final', label: 'Final',          minEq: 2 },
    ],
    plata:  [
      { fase: 'plata_semi',  label: 'Semifinales', minEq: 2 },
      { fase: 'plata_final', label: 'Final',        minEq: 2 },
    ],
    bronce: [
      { fase: 'bronce_final', label: 'Final', minEq: 2 },
    ],
  }

  const equiposCopa = Array.isArray(copasEquipos[copa]) ? copasEquipos[copa] : []

  const disponibles = Object.entries(equipos)
    .filter(([id]) => !equiposCopa.includes(id))
    .map(([id, eq]) => ({ id, nombre: eq.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const saveEquipos = (nuevos) => set(ref(db, `copas_equipos/${copa}`), nuevos.length ? nuevos : null)

  const agregarEquipo = async () => {
    if (!addEq) return
    await saveEquipos([...equiposCopa, addEq])
    setAddEq('')
  }

  const quitarEquipo = (eqId) => saveEquipos(equiposCopa.filter(id => id !== eqId))

  const mover = (idx, dir) => {
    const arr = [...equiposCopa]
    const swap = idx + dir
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    saveEquipos(arr)
  }

  const buildBracket = (ids) => {
    const n = ids.length
    const out = []
    for (let i = 0; i < Math.floor(n / 2); i++)
      out.push({ local: ids[i], visitante: ids[n - 1 - i] })
    return out
  }

  const generarRonda = async (fase, minEq) => {
    if (equiposCopa.length < minEq) return alert(`Necesitás al menos ${minEq} equipos`)
    const yaHay = Object.values(partidos).some(p => p.fase === fase)
    if (yaHay && !confirm('Ya hay partidos en esta ronda. ¿Reemplazarlos?')) return
    setGen(fase)
    for (const [id, p] of Object.entries(partidos))
      if (p.fase === fase) {
        await remove(ref(db, `partidos/${id}`))
        await remove(ref(db, `goles/${id}`))
        await remove(ref(db, `tarjetas/${id}`))
      }
    for (const { local, visitante } of buildBracket(equiposCopa))
      await push(ref(db, 'partidos'), { numero: null, fase, local, visitante, fechaHora: null, jugado: false, golesLocal: null, golesVisitante: null })
    setGen(false)
  }

  const copaInfo = COPAS.find(c => c.id === copa)
  const rondasCopa = RONDAS[copa]

  return (
    <div className="pt-4 space-y-4">
      {/* Selector copa */}
      <div className="flex gap-2">
        {COPAS.map(c => (
          <button key={c.id} onClick={() => { setCopa(c.id); setAddEq('') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all
              ${copa === c.id ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}>
            {c.icon} {c.label.replace('Copa ', '')}
          </button>
        ))}
      </div>

      {/* Equipos */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">
          {copaInfo?.label}
          <span className="ml-2 text-gray-500 font-normal text-xs">{equiposCopa.length} equipo{equiposCopa.length !== 1 ? 's' : ''}</span>
        </p>

        {equiposCopa.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-2">Sin equipos — agregá los participantes</p>
        )}

        {equiposCopa.map((eqId, idx) => (
          <div key={eqId} className="flex items-center gap-2 bg-[#111] rounded-xl px-3 py-2">
            <span className="text-green-500 text-xs font-black w-4 text-center flex-shrink-0">{idx + 1}</span>
            {equipos[eqId]?.escudo && (
              <img src={equipos[eqId].escudo} className="w-7 h-7 object-contain rounded flex-shrink-0" />
            )}
            <span className="flex-1 text-white text-sm font-semibold truncate">{equipos[eqId]?.nombre || eqId}</span>
            <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="text-gray-600 text-xs px-1 disabled:opacity-20">▲</button>
            <button onClick={() => mover(idx, 1)} disabled={idx === equiposCopa.length - 1} className="text-gray-600 text-xs px-1 disabled:opacity-20">▼</button>
            <button onClick={() => quitarEquipo(eqId)} className="text-red-400 text-xs px-1">✕</button>
          </div>
        ))}

        {disponibles.length > 0 && (
          <div className="flex gap-2 pt-1">
            <select value={addEq} onChange={e => setAddEq(e.target.value)}
              className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none">
              <option value="">+ Agregar equipo</option>
              {disponibles.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
            </select>
            <button onClick={agregarEquipo} disabled={!addEq}
              className="bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-30">+</button>
          </div>
        )}
      </div>

      {/* Rondas */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Rondas</p>
        {rondasCopa.map(({ fase, label, minEq }) => {
          const ps = Object.entries(partidos)
            .filter(([, p]) => p.fase === fase)
            .map(([id, p]) => ({ id, ...p }))
          return (
            <div key={fase} className="bg-[#1a1a1a] rounded-xl border border-green-900/20 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <p className="flex-1 text-sm font-bold text-white">{copaInfo?.icon} {label}</p>
                <button
                  onClick={() => generarRonda(fase, minEq)}
                  disabled={!!gen || equiposCopa.length < minEq}
                  className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-30 active:scale-95 transition-all whitespace-nowrap"
                >
                  {gen === fase ? '⏳' : ps.length > 0 ? '↺ Regenerar' : '🎲 Generar'}
                </button>
              </div>
              {ps.length > 0 && (
                <div className="border-t border-green-900/10 divide-y divide-green-900/5">
                  {ps.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-4 py-2 text-xs">
                      <span className="flex-1 text-right text-white font-semibold truncate">{equipos[p.local]?.nombre || '?'}</span>
                      <span className={`flex-shrink-0 px-2 font-black ${p.jugado ? 'text-green-400' : 'text-gray-600'}`}>
                        {p.jugado ? `${p.golesLocal}-${p.golesVisitante}` : 'vs'}
                      </span>
                      <span className="flex-1 text-white font-semibold truncate">{equipos[p.visitante]?.nombre || '?'}</span>
                      <button onClick={() => remove(ref(db, `partidos/${p.id}`))} className="text-red-400 pl-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
              {ps.length === 0 && equiposCopa.length < minEq && (
                <p className="px-4 pb-3 text-[11px] text-gray-600">Necesitás al menos {minEq} equipos en la lista</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── RESULTADOS ─── */
function TabResultados({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const jugadores = data.jugadores || {}
  const goles = data.goles || {}
  const tarjetas = data.tarjetas || {}
  const [partidoId, setPartidoId] = useState('')
  const [gl, setGl] = useState('')
  const [gv, setGv] = useState('')
  const [savingRes, setSavingRes] = useState(false)
  const [golEq, setGolEq] = useState('')
  const [golJug, setGolJug] = useState('')
  const [golEC, setGolEC] = useState(false)
  const [tarjEq, setTarjEq] = useState('')
  const [tarjJug, setTarjJug] = useState('')
  const [tarjTipo, setTarjTipo] = useState('amarilla')

  const partido = partidoId ? partidos[partidoId] : null
  const listaPartidos = Object.entries(partidos)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (a.numero || 0) - (b.numero || 0))

  const golesPartido = Object.entries(goles[partidoId] || {})
  const tarjetasPartido = Object.entries(tarjetas[partidoId] || {})

  const guardarResultado = async () => {
    if (!partidoId || gl === '' || gv === '') return
    setSavingRes(true)
    await update(ref(db, `partidos/${partidoId}`), { golesLocal: Number(gl), golesVisitante: Number(gv), jugado: true })
    setSavingRes(false)
  }

  const agregarGol = async () => {
    if (!golEq || (!golEC && !golJug)) return
    await push(ref(db, `goles/${partidoId}`), { equipoId: golEq, jugadorId: golJug || 'sin_jugador', enContra: golEC })
    setGolEq(''); setGolJug(''); setGolEC(false)
  }

  const agregarTarjeta = async () => {
    if (!tarjEq || !tarjJug) return
    await push(ref(db, `tarjetas/${partidoId}`), { equipoId: tarjEq, jugadorId: tarjJug, tipo: tarjTipo })
    setTarjEq(''); setTarjJug(''); setTarjTipo('amarilla')
  }

  const jugsPorEquipo = id => Object.entries(jugadores[id] || {})
    .map(([jid, j]) => ({ jid, nombre: j.nombre, numero: j.numero || '' }))
    .sort((a, b) => (Number(a.numero) || 999) - (Number(b.numero) || 999) || a.nombre.localeCompare(b.nombre))

  return (
    <div className="pt-4 space-y-4">
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30">
        <p className="text-xs text-gray-500 mb-2">Seleccioná un partido</p>
        <select value={partidoId} onChange={e => {
          const p = partidos[e.target.value]
          setPartidoId(e.target.value)
          setGl(p?.golesLocal ?? '')
          setGv(p?.golesVisitante ?? '')
        }}
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
          <option value="">— Elegí un partido —</option>
          {listaPartidos.map(p => (
            <option key={p.id} value={p.id}>
              F{p.numero} · {equipos[p.local]?.nombre || '?'} vs {equipos[p.visitante]?.nombre || '?'}{p.jugado ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {partido && (
        <>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
            <p className="text-sm font-bold text-green-400">Resultado</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1">{equipos[partido.local]?.nombre}</p>
                <input value={gl} onChange={e => setGl(e.target.value)} type="number" min="0"
                  className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-3 text-white text-2xl font-black text-center outline-none" />
              </div>
              <span className="text-gray-600 font-black">-</span>
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1">{equipos[partido.visitante]?.nombre}</p>
                <input value={gv} onChange={e => setGv(e.target.value)} type="number" min="0"
                  className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-3 text-white text-2xl font-black text-center outline-none" />
              </div>
            </div>
            <button onClick={guardarResultado} disabled={savingRes || gl === '' || gv === ''}
              className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
              {savingRes ? 'Guardando...' : partido.jugado ? '✓ Actualizar Resultado' : 'Guardar Resultado'}
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
            <p className="text-sm font-bold text-green-400">Goles (por jugador)</p>
            <div className="space-y-2">
              {golesPartido.map(([id, g]) => {
                const jug = jugadores[g.equipoId]?.[g.jugadorId]
                return (
                  <div key={id} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">⚽</span>
                    <span className="flex-1 text-white">
                      {jug?.numero && <span className="text-green-500">#{jug.numero} </span>}
                      {jug?.nombre || 'Jugador'} <span className="text-gray-500 text-xs">({equipos[g.equipoId]?.nombre})</span>{g.enContra ? <span className="text-red-400 text-xs ml-1">en contra</span> : ''}
                    </span>
                    <button onClick={() => remove(ref(db, `goles/${partidoId}/${id}`))} className="text-red-400 text-xs">✕</button>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <select value={golEq} onChange={e => { setGolEq(e.target.value); setGolJug('') }}
                className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-2 py-2 text-white text-xs outline-none">
                <option value="">Equipo</option>
                {[partido.local, partido.visitante].map(id => (
                  <option key={id} value={id}>{equipos[id]?.nombre || id}</option>
                ))}
              </select>
              <select value={golJug} onChange={e => setGolJug(e.target.value)}
                className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-2 py-2 text-white text-xs outline-none">
                <option value="">Jugador</option>
                {jugsPorEquipo(golEq).map(j => <option key={j.jid} value={j.jid}>{j.numero ? `#${j.numero} · ${j.nombre}` : j.nombre}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={golEC} onChange={e => setGolEC(e.target.checked)} className="accent-green-500" />
                Gol en contra
              </label>
              <button onClick={agregarGol} disabled={!golEq} className="ml-auto bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                + Agregar
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
            <p className="text-sm font-bold text-green-400">Tarjetas</p>
            <div className="space-y-2">
              {tarjetasPartido.map(([id, t]) => {
                const jug = jugadores[t.equipoId]?.[t.jugadorId]
                return (
                  <div key={id} className="flex items-center gap-2 text-sm">
                    <span>{t.tipo === 'amarilla' ? '🟨' : '🟥'}</span>
                    <span className="flex-1 text-white">
                      {jug?.numero && <span className="text-green-500">#{jug.numero} </span>}
                      {jug?.nombre || '?'} <span className="text-gray-500 text-xs">({equipos[t.equipoId]?.nombre})</span>
                    </span>
                    <button onClick={() => remove(ref(db, `tarjetas/${partidoId}/${id}`))} className="text-red-400 text-xs">✕</button>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <select value={tarjEq} onChange={e => { setTarjEq(e.target.value); setTarjJug('') }}
                className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-2 py-2 text-white text-xs outline-none">
                <option value="">Equipo</option>
                {[partido.local, partido.visitante].map(id => (
                  <option key={id} value={id}>{equipos[id]?.nombre || id}</option>
                ))}
              </select>
              <select value={tarjJug} onChange={e => setTarjJug(e.target.value)}
                className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-2 py-2 text-white text-xs outline-none">
                <option value="">Jugador</option>
                {jugsPorEquipo(tarjEq).map(j => <option key={j.jid} value={j.jid}>{j.numero ? `#${j.numero} · ${j.nombre}` : j.nombre}</option>)}
              </select>
              <select value={tarjTipo} onChange={e => setTarjTipo(e.target.value)}
                className="bg-[#111] border border-green-900/40 rounded-xl px-2 py-2 text-white text-xs outline-none">
                <option value="amarilla">🟨</option>
                <option value="roja">🟥</option>
              </select>
            </div>
            <button onClick={agregarTarjeta} disabled={!tarjEq || !tarjJug}
              className="w-full bg-yellow-700 text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-40">
              + Agregar Tarjeta
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── NOVEDADES ─── */
function TabNovedades({ data }) {
  const novedades = data.novedades || {}
  const [titulo, setTitulo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [imagen, setImagen] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleImg = async e => {
    const f = e.target.files[0]
    if (!f) return
    setImagen(await compressImage(f, 800, 0.75))
  }

  const agregar = async () => {
    if (!titulo.trim()) return
    setLoading(true)
    await push(ref(db, 'novedades'), { titulo: titulo.trim(), detalle: detalle.trim(), imagen: imagen || null, orden: Date.now() })
    setTitulo(''); setDetalle(''); setImagen(null); setLoading(false)
  }

  const lista = Object.entries(novedades)
    .map(([id, n]) => ({ id, ...n }))
    .sort((a, b) => b.orden - a.orden)

  return (
    <div className="pt-4 space-y-4">
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">Nueva Novedad</p>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título"
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
        <textarea value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Detalle (opcional)" rows={3}
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none resize-none" />
        <div>
          <p className="text-xs text-gray-500 mb-1">Imagen (opcional)</p>
          <input type="file" accept="image/*" onChange={handleImg} className="text-xs text-gray-400" />
          {imagen && <img src={imagen} className="w-full h-32 object-cover rounded-lg mt-2" />}
        </div>
        <button onClick={agregar} disabled={loading || !titulo.trim()}
          className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
          {loading ? 'Guardando...' : 'Publicar'}
        </button>
      </div>

      <div className="space-y-3">
        {lista.map(n => (
          <div key={n.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-green-900/20">
            {n.imagen && <img src={n.imagen} className="w-full h-32 object-cover" />}
            <div className="p-3 flex items-start gap-2">
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{n.titulo}</p>
                {n.detalle && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.detalle}</p>}
              </div>
              <button onClick={() => remove(ref(db, `novedades/${n.id}`))} className="text-red-400 text-xs flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
        {lista.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Sin novedades</p>}
      </div>
    </div>
  )
}

/* ─── FINANZAS ─── */
const fmtMoney = n => `$ ${Number(n || 0).toLocaleString('es-AR')}`
const soloDigitos = str => str.replace(/[^\d]/g, '')
const PRIMERA_FECHA_FINANZAS = 4
const GASTOS_FIJOS = [
  { key: 'cancha', label: 'Cancha' },
  { key: 'arbitros', label: 'Árbitros' },
  { key: 'bebidas', label: 'Bebidas' },
]

// Input de monto: muestra "$ 55.000" mientras se escribe, guarda solo dígitos
function MoneyInput({ value, onChange, onBlur, placeholder, className }) {
  return (
    <input
      type="text" inputMode="numeric"
      value={value === '' ? '' : fmtMoney(value)}
      onChange={e => onChange(soloDigitos(e.target.value))}
      onBlur={onBlur}
      placeholder={placeholder || '$ 0'}
      className={className}
    />
  )
}

function TabFinanzas({ data }) {
  const equipos = data.equipos || {}
  const equiposActivos = Object.fromEntries(Object.entries(equipos).filter(([, eq]) => !eq.retirado))
  const partidos = data.partidos || {}
  const finanzas = data.finanzas || {}
  const config = finanzas.config || {}
  const deudaInicial = config.deudaInicial || {}

  const cantEquipos = Object.keys(equiposActivos).length
  const totalFechas = cantEquipos > 1 ? (cantEquipos % 2 === 0 ? cantEquipos - 1 : cantEquipos) : 9

  const [fechaSel, setFechaSel] = useState(PRIMERA_FECHA_FINANZAS)

  const fFecha = finanzas[fechaSel] || {}
  const pagos = fFecha.pagos || {}
  const gastos = fFecha.gastos || {}
  const cuota = fFecha.cuota ?? ''
  const cajaAhorro = fFecha.cajaAhorro ?? ''

  const [cuotaInput, setCuotaInput] = useState(String(cuota))
  const [cajaInput, setCajaInput] = useState(String(cajaAhorro))
  const [gastoInputs, setGastoInputs] = useState({})
  const [cajaBaseInput, setCajaBaseInput] = useState(String(config.cajaBase ?? ''))
  const [objetivoInput, setObjetivoInput] = useState(String(config.objetivo ?? ''))
  const [pagoInputs, setPagoInputs] = useState({})
  useEffect(() => { setCuotaInput(String(cuota)) }, [fechaSel, cuota])
  useEffect(() => { setCajaInput(String(cajaAhorro)) }, [fechaSel, cajaAhorro])
  useEffect(() => {
    const init = {}
    Object.keys(equiposActivos).forEach(id => {
      init[`${id}_efectivo`] = String(pagos[id]?.efectivo ?? '')
      init[`${id}_transferencia`] = String(pagos[id]?.transferencia ?? '')
    })
    setPagoInputs(init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSel, JSON.stringify(pagos)])
  useEffect(() => {
    setGastoInputs(Object.fromEntries(GASTOS_FIJOS.map(g => [g.key, String(gastos[g.key] ?? '')])))
  }, [fechaSel, JSON.stringify(gastos)])
  useEffect(() => { setCajaBaseInput(String(config.cajaBase ?? '')) }, [config.cajaBase])
  useEffect(() => { setObjetivoInput(String(config.objetivo ?? '')) }, [config.objetivo])

  const guardarCuota = () => update(ref(db, `finanzas/${fechaSel}`), { cuota: cuotaInput === '' ? null : Number(cuotaInput) })
  const guardarCaja = () => update(ref(db, `finanzas/${fechaSel}`), { cajaAhorro: cajaInput === '' ? null : Number(cajaInput) })
  const guardarGasto = key => update(ref(db, `finanzas/${fechaSel}/gastos`), { [key]: gastoInputs[key] === '' ? null : Number(gastoInputs[key]) })
  const guardarCajaBase = () => update(ref(db, 'finanzas/config'), { cajaBase: cajaBaseInput === '' ? null : Number(cajaBaseInput) })
  const guardarObjetivo = () => update(ref(db, 'finanzas/config'), { objetivo: objetivoInput === '' ? null : Number(objetivoInput) })

  const guardarPago = (equipoId, campo, valor) =>
    update(ref(db, `finanzas/${fechaSel}/pagos/${equipoId}`), { [campo]: valor === '' ? null : Number(valor) })

  const toggleConfirmado = equipoId =>
    update(ref(db, `finanzas/${fechaSel}/pagos/${equipoId}`), { confirmado: !pagos[equipoId]?.confirmado })

  const recaudadoEfectivoFecha = Object.values(pagos).reduce((s, p) => s + Number(p.efectivo || 0), 0)
  const recaudadoTransferenciaFecha = Object.values(pagos).reduce((s, p) => s + Number(p.transferencia || 0), 0)
  const recaudadoFecha = recaudadoEfectivoFecha + recaudadoTransferenciaFecha
  const gastosFecha = Object.values(gastos).reduce((s, m) => s + Number(m || 0), 0)
  const gananciaFecha = recaudadoFecha - gastosFecha
  const repartoFecha = gananciaFecha - Number(cajaAhorro || 0)

  // Solo se cuentan las fechas desde que arrancamos a llevar Finanzas (Fecha 4 en adelante)
  const fechasFinanzas = Object.entries(finanzas).filter(([n]) => n !== 'config' && Number(n) >= PRIMERA_FECHA_FINANZAS)

  const resumenGeneral = fechasFinanzas.reduce((acc, [, f]) => {
    const rec = Object.values(f.pagos || {}).reduce((s, p) => s + Number(p.efectivo || 0) + Number(p.transferencia || 0), 0)
    const gas = Object.values(f.gastos || {}).reduce((s, m) => s + Number(m || 0), 0)
    acc.recaudado += rec
    acc.gastos += gas
    acc.caja += Number(f.cajaAhorro || 0)
    return acc
  }, { recaudado: 0, gastos: 0, caja: 0 })
  const gananciaGeneral = resumenGeneral.recaudado - resumenGeneral.gastos
  const repartoGeneral = gananciaGeneral - resumenGeneral.caja
  const cajaTotal = Number(config.cajaBase || 0) + resumenGeneral.caja
  const objetivo = Number(config.objetivo || 0)
  const progresoObjetivo = objetivo > 0 ? Math.min(100, (cajaTotal / objetivo) * 100) : 0

  // Deuda total acumulada por equipo: deuda inicial + cuotas - pagos, desde la Fecha 4
  const calcularDeudaTotal = eqId => {
    let total = Number(deudaInicial[eqId] || 0)
    fechasFinanzas.forEach(([, f]) => {
      const c = Number(f.cuota || 0)
      const p = (f.pagos || {})[eqId] || {}
      total += c - (Number(p.efectivo || 0) + Number(p.transferencia || 0))
    })
    return total
  }

  const deudores = Object.keys(equiposActivos)
    .map(eqId => [eqId, calcularDeudaTotal(eqId)])
    .filter(([, monto]) => monto > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="pt-4 space-y-4">

      {/* Fecha del torneo */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-600/40">
        <p className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Fecha del torneo</p>
        <select
          value={fechaSel}
          onChange={e => setFechaSel(Number(e.target.value))}
          className="w-full bg-[#111] border border-green-600/30 rounded-xl px-4 py-3 text-white text-base font-bold outline-none"
        >
          {Array.from({ length: totalFechas - PRIMERA_FECHA_FINANZAS + 1 }, (_, i) => i + PRIMERA_FECHA_FINANZAS).map(n => {
            const tiene = Object.values(partidos).some(p => p.fase === 'liga' && p.numero === n)
            return <option key={n} value={n}>Fecha {n}{tiene ? '  ✓' : ''}</option>
          })}
        </select>
      </div>

      {/* Cuota por equipo */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-600/40">
        <p className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Cuota por equipo esta fecha</p>
        <MoneyInput value={cuotaInput} onChange={setCuotaInput}
          onBlur={guardarCuota}
          className="w-full bg-[#111] border border-green-600/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
      </div>

      {/* Equipos que deben */}
      {deudores.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-red-900/40">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1.5">Equipos que deben (todo el torneo)</p>
          <div className="space-y-1">
            {deudores.map(([eqId, monto]) => (
              <div key={eqId} className="flex items-center justify-between bg-red-900/10 border border-red-900/30 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-white truncate">{equipos[eqId]?.nombre || eqId}</span>
                <span className="text-xs font-bold text-red-400 flex-shrink-0">{fmtMoney(monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagos por equipo */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-2">
        <p className="text-sm font-bold text-green-400">Pagos — Fecha {fechaSel}</p>
        {Object.entries(equiposActivos)
          .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))
          .map(([id, eq]) => {
            const p = pagos[id] || {}
            const deudaTotal = calcularDeudaTotal(id)
            return (
              <div key={id} className="bg-[#111] rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">{eq.nombre}</span>
                  <button onClick={() => toggleConfirmado(id)} className="flex-shrink-0 text-base leading-none" title="Marcar operación cerrada">
                    {p.confirmado ? '🔒' : '🔓'}
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-500 mb-0.5">Efectivo</p>
                    <MoneyInput value={pagoInputs[`${id}_efectivo`] ?? ''}
                      onChange={v => setPagoInputs(prev => ({ ...prev, [`${id}_efectivo`]: v }))}
                      onBlur={() => guardarPago(id, 'efectivo', pagoInputs[`${id}_efectivo`] ?? '')}
                      className="w-full bg-[#1a1a1a] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-500 mb-0.5">Transferencia</p>
                    <MoneyInput value={pagoInputs[`${id}_transferencia`] ?? ''}
                      onChange={v => setPagoInputs(prev => ({ ...prev, [`${id}_transferencia`]: v }))}
                      onBlur={() => guardarPago(id, 'transferencia', pagoInputs[`${id}_transferencia`] ?? '')}
                      className="w-full bg-[#1a1a1a] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none" />
                  </div>
                </div>
                <p className="text-xs">
                  <span className="text-gray-500">Debe: </span>
                  <span className={`font-bold ${deudaTotal > 0 ? 'text-red-400' : deudaTotal < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {deudaTotal > 0 ? fmtMoney(deudaTotal) : deudaTotal < 0 ? `A favor ${fmtMoney(-deudaTotal)}` : 'Al día'}
                  </span>
                </p>
              </div>
            )
          })}
      </div>

      {/* Gastos */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-2">
        <p className="text-sm font-bold text-green-400">Gastos — Fecha {fechaSel}</p>
        {GASTOS_FIJOS.map(g => (
          <div key={g.key} className="flex items-center gap-2">
            <span className="w-20 text-xs text-gray-400 flex-shrink-0">{g.label}</span>
            <MoneyInput value={gastoInputs[g.key] ?? ''}
              onChange={v => setGastoInputs(prev => ({ ...prev, [g.key]: v }))}
              className="flex-1 bg-[#111] border border-green-900/40 rounded-lg px-3 py-2 text-white text-sm outline-none" />
            {(() => {
              const confirmado = (gastoInputs[g.key] ?? '') !== '' && (gastoInputs[g.key] ?? '') === String(gastos[g.key] ?? '')
              return (
                <button onClick={() => guardarGasto(g.key)}
                  className={`rounded-lg w-9 h-9 text-sm font-black flex items-center justify-center flex-shrink-0 transition-all
                    ${confirmado ? 'bg-green-900/40 text-green-600 scale-90' : 'bg-green-700 text-white'}`}>✓</button>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Caja de ahorro + resumen de la fecha */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">Caja de ahorro — Fecha {fechaSel}</p>
        <MoneyInput value={cajaInput} onChange={setCajaInput}
          onBlur={guardarCaja} placeholder="$ 0 (a mano, según decidas esta fecha)"
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Recaudado Efectivo</p>
            <p className="text-white font-bold text-sm">{fmtMoney(recaudadoEfectivoFecha)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Recaudado Transferencia</p>
            <p className="text-white font-bold text-sm">{fmtMoney(recaudadoTransferenciaFecha)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Gastos</p>
            <p className="text-white font-bold text-sm">{fmtMoney(gastosFecha)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Ganancia neta</p>
            <p className="text-green-400 font-bold text-sm">{fmtMoney(gananciaFecha)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5 col-span-2">
            <p className="text-gray-500">Reparto <span className="text-gray-600">(ganancia neta − caja de ahorro)</span></p>
            <p className="text-yellow-400 font-bold text-sm">{fmtMoney(repartoFecha)}</p>
          </div>
        </div>
      </div>

      {/* Resumen general del torneo */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-600/40 space-y-2">
        <p className="text-sm font-bold text-green-400">Resumen general del torneo</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Recaudado</p>
            <p className="text-white font-bold text-sm">{fmtMoney(resumenGeneral.recaudado)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Gastos</p>
            <p className="text-white font-bold text-sm">{fmtMoney(resumenGeneral.gastos)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Ganancia neta</p>
            <p className="text-green-400 font-bold text-sm">{fmtMoney(gananciaGeneral)}</p>
          </div>
          <div className="bg-[#111] rounded-lg p-2.5">
            <p className="text-gray-500">Reparto acumulado</p>
            <p className="text-yellow-400 font-bold text-sm">{fmtMoney(repartoGeneral)}</p>
          </div>
        </div>

        {/* Caja de ahorro + objetivo premios */}
        <div className="bg-[#111] rounded-lg p-2.5">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-gray-500 text-xs">Caja de ahorro (premios)</span>
            <span className="text-blue-400 font-bold text-sm">{fmtMoney(cajaTotal)}</span>
          </div>
          {objetivo > 0 && (
            <>
              <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progresoObjetivo}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{progresoObjetivo.toFixed(0)}% del objetivo ({fmtMoney(objetivo)})</p>
            </>
          )}
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1">
              <p className="text-[9px] text-gray-500 mb-0.5">Caja inicial</p>
              <MoneyInput value={cajaBaseInput} onChange={setCajaBaseInput}
                onBlur={guardarCajaBase}
                className="w-full bg-[#1a1a1a] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-gray-500 mb-0.5">Objetivo premios</p>
              <MoneyInput value={objetivoInput} onChange={setObjetivoInput}
                onBlur={guardarObjetivo}
                className="w-full bg-[#1a1a1a] border border-green-900/30 rounded-lg px-2 py-1.5 text-white text-xs outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
