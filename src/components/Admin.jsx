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

const TABS = ['Equipos', 'Jugadores', 'Partidos', 'Copas', 'Resultados', 'Novedades', 'Analytics']

export default function Admin({ data }) {
  const [tab, setTab] = useState('Equipos')

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-3">
        <h1 className="text-xl font-black text-white mb-3">Panel Admin</h1>
        {/* Tabs en 2 renglones si no entran todos */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${tab === t ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}>
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
        {tab === 'Analytics'  && <TabAnalytics data={data} />}
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
            ${editId === id ? 'border-green-600/50' : 'border-green-900/20'}`}>
            {eq.escudo
              ? <img src={eq.escudo} className="w-10 h-10 object-contain rounded-lg flex-shrink-0" />
              : <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center text-xl flex-shrink-0">⚽</div>
            }
            <p className="flex-1 font-semibold text-white min-w-0 truncate">{eq.nombre}</p>
            <button onClick={() => editar(id, eq)}
              className="text-xs bg-green-900/40 text-green-400 border border-green-800/40 rounded-lg px-3 py-1.5 font-medium flex-shrink-0">
              Editar
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

function slotPrefs(nombre) {
  const n = (nombre || '').toLowerCase().trim()
  if (n.includes('antidoping')) return [14]
  if (n.includes('banda')) return [16]
  if (n.includes('tuca') || n.includes('resto')) return [14, 15]
  if (n === 'san jose') return [15, 16]  // solo el San Jose original (no San Jose FC)
  if (n.includes('roma')) return [15, 16]
  return [14, 15, 16]
}

function assignMatchSlots(matches, equipos) {
  const cap = { 14: 2, 15: 2, 16: 2 }
  const res = new Map()
  const prio = id => {
    const n = (equipos[id]?.nombre || '').toLowerCase().trim()
    if (n.includes('antidoping')) return 1
    if (n.includes('banda')) return 2
    if (n.includes('tuca') || n.includes('resto')) return 3
    if (n === 'san jose' || n.includes('roma')) return 4
    return 5
  }
  const sorted = [...matches].sort((a, b) =>
    Math.min(prio(a.local), prio(a.visitante)) - Math.min(prio(b.local), prio(b.visitante))
  )
  for (const m of sorted) {
    const hp = slotPrefs(equipos[m.local]?.nombre)
    const ap = slotPrefs(equipos[m.visitante]?.nombre)
    const perfect = GAME_SLOTS.filter(s => hp.includes(s) && ap.includes(s) && cap[s] > 0)
    // Cuando no hay overlap, priorizamos el slot del equipo con mayor restricción
    const hl = prio(m.local), al = prio(m.visitante)
    const primPrefs = hl <= al ? hp : ap
    const primaryOK = GAME_SLOTS.filter(s => primPrefs.includes(s) && cap[s] > 0)
    const oneOK     = GAME_SLOTS.filter(s => (hp.includes(s) || ap.includes(s)) && cap[s] > 0)
    const any       = GAME_SLOTS.filter(s => cap[s] > 0)
    const slot      = perfect[0] ?? primaryOK[0] ?? oneOK[0] ?? any[0] ?? 14
    res.set(m, slot)
    cap[slot]--
  }
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
function PartidoCard({ p, equipos, jugadores, goles, tarjetas, fechaDia }) {
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
            <input type="number" min="0" value={gl} onChange={e => setGl(e.target.value)}
              className="w-10 bg-[#111] border border-green-900/30 rounded-lg text-white text-xl font-black text-center outline-none py-1" />
            <span className="text-gray-600 font-black text-lg">-</span>
            <input type="number" min="0" value={gv} onChange={e => setGv(e.target.value)}
              className="w-10 bg-[#111] border border-green-900/30 rounded-lg text-white text-xl font-black text-center outline-none py-1" />
            <button onClick={guardarResultado}
              className="bg-green-600 text-white rounded-lg w-9 h-9 text-sm font-black flex items-center justify-center ml-1">
              {saving ? '⏳' : '✓'}
            </button>
          </div>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {equipos[p.visitante]?.escudo && <img src={equipos[p.visitante].escudo} className="w-8 h-8 object-contain rounded flex-shrink-0" />}
            <span className="text-sm font-bold text-white truncate">{equipos[p.visitante]?.nombre || '?'}</span>
          </div>
        </div>

        {/* Solo hora */}
        <div className="flex gap-2">
          <input type="time" value={hora} onChange={e => { setHora(e.target.value); setHoraSaved(false) }}
            className="flex-1 bg-[#111] border border-green-900/30 rounded-lg px-3 py-1.5 text-white text-sm outline-none" />
          <button onClick={guardarHora} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${horaSaved ? 'bg-green-600 text-white border border-green-600' : 'bg-[#222] border border-green-900/30 text-green-400'}`}>✓</button>
        </div>
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
                    {chipsEquipo.map(g => (
                      <div key={`${g.equipoId}___${g.jugadorId}`}
                        className="flex items-center gap-1 bg-green-900/30 border border-green-700/30 rounded-full px-2 py-0.5">
                        <span className="text-green-300 text-[11px] font-semibold">
                          {jugadores[g.equipoId]?.[g.jugadorId]?.nombre?.split(' ')[0] || '?'}
                          {g.count > 1 && <span className="text-green-500 ml-0.5 font-black">x{g.count}</span>}
                        </span>
                        <button onClick={() => quitarGol(g.ids)} className="text-red-400 text-[10px] leading-none ml-0.5">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Select jugador registrado */}
                {jugs.length > 0 && (
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
            {tarjetasPartido.map(([tid, t]) => (
              <div key={tid} className="flex items-center gap-2 text-xs bg-[#222] rounded-lg px-2.5 py-1.5">
                <span>{t.tipo === 'amarilla' ? '🟨' : '🟥'}</span>
                <span className="flex-1 text-gray-300 truncate">
                  {jugadores[t.equipoId]?.[t.jugadorId]?.nombre || '?'}
                  <span className="text-gray-500 ml-1">· {equipos[t.equipoId]?.nombre}</span>
                </span>
                <button onClick={() => remove(ref(db, `tarjetas/${p.id}/${tid}`))} className="text-red-400 flex-shrink-0">✕</button>
              </div>
            ))}

            {/* Agregar tarjeta */}
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
                  {jugsPorEquipo(tarjEq).map(j => <option key={j.jid} value={j.jid}>{j.nombre}</option>)}
                </select>
                <button onClick={agregarTarjeta} disabled={!tarjEq || !tarjJug}
                  className="bg-yellow-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 flex-shrink-0">
                  + Tarjeta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {p.jugado && (
        <div className="bg-green-900/20 px-3 py-1">
          <span className="text-[11px] text-green-400">✓ Resultado guardado: {p.golesLocal} - {p.golesVisitante}</span>
        </div>
      )}
    </div>
  )
}

/* ─── PARTIDOS ─── */
function TabPartidos({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const jugadores = data.jugadores || {}
  const goles = data.goles || {}
  const tarjetas = data.tarjetas || {}
  const masterFixture = data.master_fixture || null
  const homeFecha = data.home_fecha || null

  const cantEquipos = Object.keys(equipos).length
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
  const dateInputRef = useRef(null)

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

  const partidosFecha = Object.entries(partidos)
    .filter(([, p]) => p.fase === 'liga' && p.numero === fechaSel)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => a.id.localeCompare(b.id))

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
      fixture = buildRoundRobin(Object.keys(equipos), equipos)
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
    const slotMap = assignMatchSlots(activos, equipos)
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
    if (!confirm(`¿Borrar todos los partidos de la Fecha ${fechaSel}?`)) return
    for (const p of partidosFecha) {
      await remove(ref(db, `partidos/${p.id}`))
      await remove(ref(db, `goles/${p.id}`))
      await remove(ref(db, `tarjetas/${p.id}`))
    }
    if (homeFecha === fechaSel) await set(ref(db, 'home_fecha'), null)
  }

  return (
    <div className="pt-4 space-y-4">

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
            {Object.entries(equipos).map(([id, eq]) => {
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

        {/* Botón Generar */}
        <button
          onClick={generarFecha}
          disabled={generando || cantEquipos < 2}
          className="w-full bg-green-600 text-white rounded-xl py-3.5 text-base font-bold disabled:opacity-40 active:scale-95 transition-all"
        >
          {generando ? '⏳ Generando...' : `🎲 Generar Fecha ${fechaSel}`}
        </button>

        {/* Agregar partido manualmente */}
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
                    {Object.entries(equipos)
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
                    {Object.entries(equipos)
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

        {/* Aplicar fecha a partidos ya creados */}
        {partidosFecha.length > 0 && fechaDia && (
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
            <button onClick={eliminarFecha} className="text-[11px] text-red-400">Borrar fecha</button>
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
              {golesPartido.map(([id, g]) => (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">⚽</span>
                  <span className="flex-1 text-white">{jugadores[g.equipoId]?.[g.jugadorId]?.nombre || 'Jugador'} <span className="text-gray-500 text-xs">({equipos[g.equipoId]?.nombre})</span>{g.enContra ? <span className="text-red-400 text-xs ml-1">en contra</span> : ''}</span>
                  <button onClick={() => remove(ref(db, `goles/${partidoId}/${id}`))} className="text-red-400 text-xs">✕</button>
                </div>
              ))}
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
              {tarjetasPartido.map(([id, t]) => (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span>{t.tipo === 'amarilla' ? '🟨' : '🟥'}</span>
                  <span className="flex-1 text-white">{jugadores[t.equipoId]?.[t.jugadorId]?.nombre || '?'} <span className="text-gray-500 text-xs">({equipos[t.equipoId]?.nombre})</span></span>
                  <button onClick={() => remove(ref(db, `tarjetas/${partidoId}/${id}`))} className="text-red-400 text-xs">✕</button>
                </div>
              ))}
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

/* ─── ANALYTICS ─── */
function TabAnalytics({ data }) {
  const analytics = data.analytics || {}
  const secciones = analytics.secciones || {}
  const visitas = analytics.visitas || {}

  const total = Object.keys(visitas).length

  const LABEL = { home: 'Inicio', fixture: 'Fixture', tabla: 'Tabla', copas: 'Copas', stats: 'Estadísticas' }
  const ICON  = { home: '🏠', fixture: '📅', tabla: '📊', copas: '🏆', stats: '⚽' }

  const seccionesOrdenadas = Object.entries(secciones)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)

  const visitasRecientes = Object.entries(visitas)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 50)

  const fmtFecha = iso => {
    try { return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  const maxCount = seccionesOrdenadas[0]?.count || 1

  return (
    <div className="pt-4 space-y-4">

      {/* Total */}
      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-green-900/30 text-center">
        <p className="text-5xl font-black text-green-400">{total}</p>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Visitas totales</p>
      </div>

      {/* Secciones */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">Secciones más visitadas</p>
        {seccionesOrdenadas.length === 0
          ? <p className="text-gray-600 text-sm text-center py-2">Sin datos aún</p>
          : seccionesOrdenadas.map(({ id, count }) => (
            <div key={id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-semibold">{ICON[id] || '•'} {LABEL[id] || id}</span>
                <span className="text-green-400 font-black">{count}</span>
              </div>
              <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))
        }
      </div>

      {/* Visitas recientes */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-1">
        <p className="text-sm font-bold text-green-400 mb-3">Últimas visitas</p>
        {visitasRecientes.length === 0
          ? <p className="text-gray-600 text-sm text-center py-2">Sin datos aún</p>
          : visitasRecientes.map(v => (
            <div key={v.id} className="flex items-center gap-3 py-2 border-b border-green-900/10 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{v.modelo}</p>
                <p className="text-gray-500 text-[10px]">{v.so} · {v.browser}</p>
              </div>
              <p className="text-gray-600 text-[10px] flex-shrink-0">{fmtFecha(v.fecha)}</p>
            </div>
          ))
        }
      </div>

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
