import { useState } from 'react'
import { db, ref, push, update, remove } from '../firebase'
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

const TABS = ['Equipos', 'Jugadores', 'Partidos', 'Resultados', 'Novedades']

export default function Admin({ data }) {
  const [tab, setTab] = useState('Equipos')

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-3">
        <h1 className="text-xl font-black text-white mb-3">Panel Admin</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all
                ${tab === t ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-6">
        {tab === 'Equipos' && <TabEquipos data={data} />}
        {tab === 'Jugadores' && <TabJugadores data={data} />}
        {tab === 'Partidos' && <TabPartidos data={data} />}
        {tab === 'Resultados' && <TabResultados data={data} />}
        {tab === 'Novedades' && <TabNovedades data={data} />}
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
    const b64 = await compressImage(f, 300, 0.8)
    setEscudo(b64)
  }

  const guardar = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    const payload = { nombre: nombre.trim(), ...(escudo !== undefined && { escudo: escudo || null }) }
    if (editId) {
      await update(ref(db, `equipos/${editId}`), payload)
    } else {
      await push(ref(db, 'equipos'), { nombre: nombre.trim(), escudo: escudo || null })
    }
    setNombre(''); setEscudo(null); setEditId(null); setLoading(false)
  }

  const editar = (id, eq) => {
    setEditId(id); setNombre(eq.nombre); setEscudo(undefined)
  }

  const eliminar = async id => {
    if (!confirm('¿Eliminar equipo?')) return
    await remove(ref(db, `equipos/${id}`))
    await remove(ref(db, `jugadores/${id}`))
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">{editId ? 'Editar Equipo' : 'Nuevo Equipo'}</p>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del equipo"
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
        <div>
          <p className="text-xs text-gray-500 mb-1">Escudo (opcional)</p>
          <input type="file" accept="image/*" onChange={handleImagen} className="text-xs text-gray-400" />
          {escudo && <img src={escudo} className="w-16 h-16 object-contain mt-2 rounded-lg" />}
        </div>
        <div className="flex gap-2">
          {editId && <button onClick={() => { setEditId(null); setNombre(''); setEscudo(null) }} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-2.5 text-sm">Cancelar</button>}
          <button onClick={guardar} disabled={loading || !nombre.trim()} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
            {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(equipos).map(([id, eq]) => (
          <div key={id} className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/20 flex items-center gap-3">
            {eq.escudo ? <img src={eq.escudo} className="w-10 h-10 object-contain rounded-lg" /> : <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center text-xl">⚽</div>}
            <p className="flex-1 font-semibold text-white">{eq.nombre}</p>
            <button onClick={() => editar(id, eq)} className="text-xs text-green-400 px-2 py-1">Editar</button>
            <button onClick={() => eliminar(id)} className="text-xs text-red-400 px-2 py-1">Borrar</button>
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
  const [loading, setLoading] = useState(false)

  const lista = equipoSel ? Object.entries(jugadores[equipoSel] || {}) : []

  const agregar = async () => {
    if (!equipoSel || !nombre.trim()) return
    setLoading(true)
    await push(ref(db, `jugadores/${equipoSel}`), { nombre: nombre.trim(), dni: dni.trim() })
    setNombre(''); setDni(''); setLoading(false)
  }

  const eliminar = async jugId => {
    if (!confirm('¿Eliminar jugador?')) return
    await remove(ref(db, `jugadores/${equipoSel}/${jugId}`))
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">Agregar Jugador</p>
        <select value={equipoSel} onChange={e => setEquipoSel(e.target.value)}
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
          <option value="">— Seleccioná un equipo —</option>
          {Object.entries(equipos).map(([id, eq]) => <option key={id} value={id}>{eq.nombre}</option>)}
        </select>
        {equipoSel && <>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del jugador"
            className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
          <input value={dni} onChange={e => setDni(e.target.value)} placeholder="DNI (opcional)" inputMode="numeric"
            className="w-full bg-[#111] border border-green-900/40 rounded-xl px-4 py-2.5 text-white text-sm outline-none" />
          <button onClick={agregar} disabled={loading || !nombre.trim()} className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
            {loading ? 'Guardando...' : 'Agregar Jugador'}
          </button>
        </>}
      </div>

      {equipoSel && (
        <div className="space-y-2">
          <p className="text-xs text-green-400 font-bold uppercase tracking-widest">{equipos[equipoSel]?.nombre} · {lista.length} jugadores</p>
          {lista.map(([id, j]) => (
            <div key={id} className="bg-[#1a1a1a] rounded-xl px-3 py-2.5 border border-green-900/20 flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{j.nombre}</p>
                {j.dni && <p className="text-[11px] text-gray-500">DNI: {j.dni}</p>}
              </div>
              <button onClick={() => eliminar(id)} className="text-xs text-red-400 px-2">Borrar</button>
            </div>
          ))}
          {lista.length === 0 && <p className="text-gray-600 text-sm text-center py-3">Sin jugadores</p>}
        </div>
      )}
    </div>
  )
}

/* ─── PARTIDOS ─── */
function TabPartidos({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const [numero, setNumero] = useState('')
  const [fase, setFase] = useState('liga')
  const [local, setLocal] = useState('')
  const [visitante, setVisitante] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [cancha, setCancha] = useState('')
  const [loading, setLoading] = useState(false)

  const agregar = async () => {
    if (!local || !visitante || local === visitante) return alert('Seleccioná equipos distintos')
    setLoading(true)
    await push(ref(db, 'partidos'), {
      numero: numero ? Number(numero) : null,
      fase, local, visitante,
      fechaHora: fechaHora || null,
      cancha: cancha || null,
      jugado: false,
      golesLocal: null,
      golesVisitante: null,
    })
    setNumero(''); setLocal(''); setVisitante(''); setFechaHora(''); setCancha(''); setLoading(false)
  }

  const eliminar = async id => {
    if (!confirm('¿Eliminar partido?')) return
    await remove(ref(db, `partidos/${id}`))
    await remove(ref(db, `goles/${id}`))
    await remove(ref(db, `tarjetas/${id}`))
  }

  const eqOpts = Object.entries(equipos).map(([id, eq]) => ({ id, label: eq.nombre })).sort((a, b) => a.label.localeCompare(b.label))
  const listaPartidos = Object.entries(partidos).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.numero || 99) - (b.numero || 99))

  return (
    <div className="pt-4 space-y-4">
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
        <p className="text-sm font-bold text-green-400">Nuevo Partido</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 mb-1">Fecha / Ronda N°</p>
            <input value={numero} onChange={e => setNumero(e.target.value)} type="number" min="1" placeholder="Ej: 1"
              className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 mb-1">Fase</p>
            <select value={fase} onChange={e => setFase(e.target.value)}
              className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none">
              {FASES_OPT.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={local} onChange={e => setLocal(e.target.value)}
            className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none">
            <option value="">Local</option>
            {eqOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <span className="self-center text-gray-600 font-bold text-xs">VS</span>
          <select value={visitante} onChange={e => setVisitante(e.target.value)}
            className="flex-1 bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none">
            <option value="">Visitante</option>
            {eqOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <input value={fechaHora} onChange={e => setFechaHora(e.target.value)} type="datetime-local"
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none" />
        <input value={cancha} onChange={e => setCancha(e.target.value)} placeholder="Cancha (opcional)"
          className="w-full bg-[#111] border border-green-900/40 rounded-xl px-3 py-2 text-white text-sm outline-none" />
        <button onClick={agregar} disabled={loading || !local || !visitante}
          className="w-full bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
          {loading ? 'Guardando...' : 'Agregar Partido'}
        </button>
      </div>

      <div className="space-y-2">
        {listaPartidos.map(p => (
          <div key={p.id} className="bg-[#1a1a1a] rounded-xl px-3 py-2.5 border border-green-900/20 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-green-500 font-semibold">{FASES_OPT.find(f => f.value === p.fase)?.label}{p.numero ? ` · F${p.numero}` : ''}</p>
              <p className="text-sm text-white font-medium truncate">
                {equipos[p.local]?.nombre || '?'} vs {equipos[p.visitante]?.nombre || '?'}
              </p>
              {p.jugado && <p className="text-xs text-green-400">{p.golesLocal} - {p.golesVisitante}</p>}
            </div>
            <button onClick={() => eliminar(p.id)} className="text-xs text-red-400 px-2 flex-shrink-0">Borrar</button>
          </div>
        ))}
        {listaPartidos.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Sin partidos</p>}
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
  // Gol form
  const [golEq, setGolEq] = useState('')
  const [golJug, setGolJug] = useState('')
  const [golEC, setGolEC] = useState(false)
  // Tarjeta form
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
    await update(ref(db, `partidos/${partidoId}`), {
      golesLocal: Number(gl), golesVisitante: Number(gv), jugado: true,
    })
    setSavingRes(false)
  }

  const agregarGol = async () => {
    if (!golEq || (!golEC && !golJug)) return
    await push(ref(db, `goles/${partidoId}`), {
      equipoId: golEq,
      jugadorId: golJug || 'sin_jugador',
      enContra: golEC,
    })
    setGolEq(''); setGolJug(''); setGolEC(false)
  }

  const agregarTarjeta = async () => {
    if (!tarjEq || !tarjJug) return
    await push(ref(db, `tarjetas/${partidoId}`), { equipoId: tarjEq, jugadorId: tarjJug, tipo: tarjTipo })
    setTarjEq(''); setTarjJug(''); setTarjTipo('amarilla')
  }

  const jugsPorEquipo = id => Object.entries(jugadores[id] || {})
    .map(([jid, j]) => ({ jid, nombre: j.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="pt-4 space-y-4">
      {/* Select partido */}
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
          {/* Resultado */}
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

          {/* Goles individuales */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
            <p className="text-sm font-bold text-green-400">Goles (opcional)</p>
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
                {jugsPorEquipo(golEq).map(j => <option key={j.jid} value={j.jid}>{j.nombre}</option>)}
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

          {/* Tarjetas */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-green-900/30 space-y-3">
            <p className="text-sm font-bold text-green-400">Tarjetas (opcional)</p>
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
                {jugsPorEquipo(tarjEq).map(j => <option key={j.jid} value={j.jid}>{j.nombre}</option>)}
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
