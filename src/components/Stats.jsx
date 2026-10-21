import { useMemo } from 'react'
import { calcPremiosPorFecha } from '../premiosPorFecha'

export default function Stats({ data, torneo, onBack }) {
  const equipos = data.equipos || {}
  // Los Amistosos no suman goles ni tarjetas: se sacan de todas las estadísticas
  const partidos = useMemo(() =>
    Object.fromEntries(Object.entries(data.partidos || {}).filter(([, p]) => p.fase !== 'amistoso'))
  , [data.partidos])
  const jugadores = data.jugadores || {}
  const goles = data.goles || {}
  const tarjetas = data.tarjetas || {}

  // Solo contamos goles/tarjetas de partidos que aún existen
  const golesValidos = useMemo(() =>
    Object.fromEntries(Object.entries(goles).filter(([pid]) => partidos[pid]))
  , [goles, partidos])

  const tarjetasValidas = useMemo(() =>
    Object.fromEntries(Object.entries(tarjetas).filter(([pid]) => partidos[pid]))
  , [tarjetas, partidos])

  // Premios por fecha: solo en la 2da Edición de Sábados
  const premiosFecha = useMemo(() => {
    if (torneo !== 'sabados2') return []
    return calcPremiosPorFecha({ partidos: data.partidos || {}, goles: data.goles || {}, jugadores, equipos, manual: data.premios_manual }).reverse()
  }, [torneo, data.partidos, data.goles, data.premios_manual, jugadores, equipos])

  const goleadores = useMemo(() => {
    const cnt = {}
    Object.values(golesValidos).flatMap(Object.values).forEach(g => {
      if (!g.enContra && g.jugadorId && g.equipoId) {
        const key = `${g.equipoId}___${g.jugadorId}`
        cnt[key] = (cnt[key] || 0) + 1
      }
    })
    return Object.entries(cnt)
      .filter(([key]) => !equipos[key.split('___')[0]]?.retirado)
      .map(([key, total]) => {
        const [equipoId, jugadorId] = key.split('___')
        const jug = jugadores[equipoId]?.[jugadorId] || {}
        const nombre = jug.nombre || 'Jugador'
        const numero = jug.numero || ''
        const equipo = equipos[equipoId]?.nombre || ''
        const escudo = equipos[equipoId]?.escudo
        return { equipoId, jugadorId, nombre, numero, equipo, escudo, total }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [golesValidos, jugadores, equipos])

  const valla = useMemo(() => {
    const gc = {}
    const pj = {}
    Object.values(partidos)
      .filter(p => p.fase === 'liga' && p.jugado && p.golesLocal != null && p.visitante && p.local)
      .forEach(p => {
        gc[p.local] = (gc[p.local] || 0) + Number(p.golesVisitante)
        gc[p.visitante] = (gc[p.visitante] || 0) + Number(p.golesLocal)
        pj[p.local] = (pj[p.local] || 0) + 1
        pj[p.visitante] = (pj[p.visitante] || 0) + 1
      })
    return Object.entries(gc)
      .filter(([id]) => !equipos[id]?.retirado)
      .map(([id, golesRecibidos]) => ({
        id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo,
        golesRecibidos, pj: pj[id] || 0
      }))
      .sort((a, b) => a.golesRecibidos - b.golesRecibidos)
      .slice(0, 5)
  }, [partidos, equipos])

  const amarillas = useMemo(() => {
    const cnt = {}
    Object.values(tarjetasValidas).flatMap(Object.values).filter(t => t.tipo === 'amarilla' && t.jugadorId && t.equipoId).forEach(t => {
      const key = `${t.equipoId}___${t.jugadorId}`
      cnt[key] = (cnt[key] || 0) + 1
    })
    return Object.entries(cnt)
      .filter(([key]) => !equipos[key.split('___')[0]]?.retirado)
      .map(([key, total]) => {
        const [equipoId, jugadorId] = key.split('___')
        const jug = jugadores[equipoId]?.[jugadorId] || {}
        return { nombre: jug.nombre || '?', numero: jug.numero || '', equipo: equipos[equipoId]?.nombre || '', escudo: equipos[equipoId]?.escudo, total }
      }).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [tarjetasValidas, jugadores, equipos])

  const rojas = useMemo(() => {
    const cnt = {}
    Object.values(tarjetasValidas).flatMap(Object.values).filter(t => t.tipo === 'roja' && t.jugadorId && t.equipoId).forEach(t => {
      const key = `${t.equipoId}___${t.jugadorId}`
      cnt[key] = (cnt[key] || 0) + 1
    })
    return Object.entries(cnt)
      .filter(([key]) => !equipos[key.split('___')[0]]?.retirado)
      .map(([key, total]) => {
        const [equipoId, jugadorId] = key.split('___')
        const jug = jugadores[equipoId]?.[jugadorId] || {}
        return { nombre: jug.nombre || '?', numero: jug.numero || '', equipo: equipos[equipoId]?.nombre || '', escudo: equipos[equipoId]?.escudo, total }
      }).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [tarjetasValidas, jugadores, equipos])

  const equipoGoleador = useMemo(() => {
    const gf = {}, pj = {}
    Object.values(partidos)
      .filter(p => p.jugado && p.golesLocal != null && p.local && p.visitante)
      .forEach(p => {
        gf[p.local] = (gf[p.local] || 0) + Number(p.golesLocal)
        gf[p.visitante] = (gf[p.visitante] || 0) + Number(p.golesVisitante)
        pj[p.local] = (pj[p.local] || 0) + 1
        pj[p.visitante] = (pj[p.visitante] || 0) + 1
      })
    return Object.entries(gf)
      .filter(([id]) => !equipos[id]?.retirado)
      .map(([id, goles]) => ({ id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo, goles, pj: pj[id] || 0 }))
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 5)
  }, [partidos, equipos])

  const equipoGoleado = useMemo(() => {
    const gc = {}, pj = {}
    Object.values(partidos)
      .filter(p => p.jugado && p.golesLocal != null && p.local && p.visitante)
      .forEach(p => {
        gc[p.local] = (gc[p.local] || 0) + Number(p.golesVisitante)
        gc[p.visitante] = (gc[p.visitante] || 0) + Number(p.golesLocal)
        pj[p.local] = (pj[p.local] || 0) + 1
        pj[p.visitante] = (pj[p.visitante] || 0) + 1
      })
    return Object.entries(gc)
      .filter(([id]) => !equipos[id]?.retirado)
      .map(([id, goles]) => ({ id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo, goles, pj: pj[id] || 0 }))
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 5)
  }, [partidos, equipos])

  const hatTricks = useMemo(() => {
    const lista = []
    Object.entries(golesValidos).forEach(([partidoId, golesPartido]) => {
      const cnt = {}
      Object.values(golesPartido).forEach(g => {
        if (!g.enContra && g.jugadorId && g.equipoId) {
          const key = `${g.equipoId}___${g.jugadorId}`
          cnt[key] = (cnt[key] || 0) + 1
        }
      })
      Object.entries(cnt).forEach(([key, total]) => {
        const [equipoId, jugadorId] = key.split('___')
        if (total >= 3 && !equipos[equipoId]?.retirado) {
          const p = partidos[partidoId]
          const rival = p ? (p.local === equipoId ? p.visitante : p.local) : null
          const jugHT = jugadores[equipoId]?.[jugadorId] || {}
          lista.push({
            nombre: jugHT.nombre || '?',
            numero: jugHT.numero || '',
            equipo: equipos[equipoId]?.nombre || '',
            escudo: equipos[equipoId]?.escudo,
            goles: total,
            vs: rival ? (equipos[rival]?.nombre || '') : '',
          })
        }
      })
    })
    return lista.sort((a, b) => b.goles - a.goles).slice(0, 5)
  }, [golesValidos, jugadores, equipos, partidos])

  const Section = ({ title, children, empty }) => (
    <section className="mb-6">
      <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">{title}</h2>
      {empty
        ? <p className="text-gray-600 text-sm text-center py-4 bg-[#1a1a1a] rounded-xl">Sin datos registrados</p>
        : children}
    </section>
  )

  const RankRow = ({ pos, nombre, numero, equipo, escudo, valor, tag, tagColor = 'text-green-400' }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
      <span className={`w-5 text-center text-xs font-black flex-shrink-0 ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-gray-300' : pos === 3 ? 'text-orange-400' : 'text-white/30'}`}>{pos}</span>
      {escudo ? <img src={escudo} className="w-7 h-7 object-contain flex-shrink-0" /> : <div className="w-7 h-7 rounded bg-white/5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          {numero && <span className="text-[11px] font-black text-green-400/60 flex-shrink-0">#{numero}</span>}
          <p className="text-sm font-semibold text-white truncate">{nombre}</p>
        </div>
        {equipo && <p className="text-[10px] text-white/30 truncate">{equipo}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-lg font-black ${tagColor}`}>{valor}</span>
        {tag && <p className="text-[9px] text-white/30 uppercase">{tag}</p>}
      </div>
    </div>
  )

  // Hero card + tabla para goleadores y valla
  const HeroCard = ({ label, labelColor = 'text-green-400', icon, heroEscudo, heroNombre, heroEquipo, heroValor, heroTag, heroBadge, resto, valorColor = 'text-green-400' }) => (
    <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 overflow-hidden mb-6">
      {/* Hero */}
      <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-green-800/30 to-transparent">
        <div className="flex items-center gap-1.5 mb-3">
          {icon}
          <span className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
          {heroEscudo
            ? <img src={heroEscudo} className="w-14 h-14 object-contain flex-shrink-0" />
            : <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xl leading-tight uppercase">{heroNombre}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider mt-0.5">{heroEquipo}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`font-black text-4xl leading-none ${valorColor}`}>{heroValor}</p>
            <p className="text-white/30 text-[10px] uppercase font-bold">{heroTag}</p>
          </div>
        </div>
        {heroBadge && (
          <div className="mt-3 pt-3 border-t border-white/8">
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-900/20 border border-green-800/30 px-3 py-1 rounded-full">{heroBadge}</span>
          </div>
        )}
      </div>
      {/* Tabla resto */}
      {resto.length > 0 && (
        <div className="border-t border-white/8">
          <div className="grid grid-cols-[28px_28px_1fr_auto] items-center px-4 py-1.5 border-b border-white/5">
            {['#','','JUGADOR', heroTag?.toUpperCase() || ''].map((h, i) => (
              <span key={i} className={`text-white/20 text-[9px] font-bold uppercase ${i >= 2 ? (i === 3 ? 'text-right' : '') : 'text-center'}`}>{h}</span>
            ))}
          </div>
          {resto.map((r, i) => <RankRow key={i} pos={i + 2} nombre={r.nombre} numero={r.numero} equipo={r.equipo} escudo={r.escudo} valor={r.valor} tag={r.tag} tagColor={valorColor} />)}
        </div>
      )}
    </div>
  )

  const premioActivo = premiosFecha[0] || null

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-800/60 to-transparent px-4 pt-6 pb-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 text-green-400 text-sm mb-4 active:opacity-70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Mi Equipo
          </button>
        )}
        <h1 className="text-xl font-black text-white">Estadísticas</h1>
        <p className="text-green-400 text-xs mt-1">Fútbol 6 · Liga Central Sur</p>
      </div>

      <div className="px-4 pb-8">

        {/* Premio de la fecha — solo el más reciente */}
        {torneo === 'sabados2' && premioActivo && (
          <section className="mb-6">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Premio de la Fecha</h2>
            <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 overflow-hidden">
              {/* Header con sponsors */}
              <div className="px-4 pt-3 pb-2.5 border-b border-white/8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-green-400 uppercase tracking-widest">Fecha {premioActivo.fecha}</span>
                  {!premioActivo.completa && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded-full uppercase">En curso</span>}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[9px] text-white/25 uppercase tracking-widest font-bold flex-shrink-0">Presentado por</span>
                  <div className="flex items-center gap-3">
                    <img src="/sponsors/roman.png" alt="Román Logic" className="h-7 object-contain" />
                    <img src="/sponsors/bombers.png" alt="Bombers" className="h-7 object-contain" />
                  </div>
                </div>
              </div>
              {/* Goleador fecha */}
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">⚽ Goleador de la fecha</p>
                {premioActivo.goleador ? premioActivo.goleador.ganadores.map(g => (
                  <div key={g.equipoId + g.jugadorId} className="flex items-center gap-3">
                    {g.escudo ? <img src={g.escudo} className="w-8 h-8 object-contain flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-white/5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      {g.numero && <span className="text-[11px] font-black text-green-400/60">#{g.numero} </span>}
                      <span className="text-sm font-semibold text-white">{g.nombre}</span>
                      <p className="text-[10px] text-white/30 truncate">{g.equipo}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-green-400">{g.total}</span>
                      <p className="text-[9px] text-white/30 uppercase">goles</p>
                    </div>
                  </div>
                )) : <p className="text-xs text-white/20">Sin goles cargados</p>}
              </div>
              {/* Valla fecha */}
              <div className="px-4 py-3">
                <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">🧤 Valla menos vencida</p>
                {premioActivo.valla ? (
                  <div className="flex items-center gap-3">
                    {premioActivo.valla.escudo ? <img src={premioActivo.valla.escudo} className="w-8 h-8 object-contain flex-shrink-0" /> : <div className="w-8 h-8 rounded bg-white/5 flex-shrink-0" />}
                    <p className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{premioActivo.valla.nombre}</p>
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-400">{premioActivo.valla.gc}</span>
                      <p className="text-[9px] text-white/30 uppercase">en contra</p>
                    </div>
                  </div>
                ) : <p className="text-xs text-white/20">Sin partidos jugados</p>}
              </div>
            </div>
          </section>
        )}

        {/* Máximo Goleador */}
        {goleadores.length === 0
          ? <Section title="Máximo Goleador" empty />
          : <HeroCard
              label="Goleador"
              icon={<svg viewBox="0 0 24 24" fill="#facc15" className="w-3.5 h-3.5"><path d="M11.219 2.897a1 1 0 011.562 0l1.98 2.39 3.07-.584a1 1 0 011.153 1.153l-.584 3.07 2.39 1.98a1 1 0 010 1.562l-2.39 1.98.584 3.07a1 1 0 01-1.153 1.153l-3.07-.584-1.98 2.39a1 1 0 01-1.562 0l-1.98-2.39-3.07.584a1 1 0 01-1.153-1.153l.584-3.07-2.39-1.98a1 1 0 010-1.562l2.39-1.98-.584-3.07a1 1 0 011.153-1.153l3.07.584z"/></svg>}
              heroEscudo={goleadores[0].escudo}
              heroNombre={goleadores[0].nombre}
              heroEquipo={goleadores[0].equipo}
              heroValor={goleadores[0].total}
              heroTag="Goles"
              heroBadge="Máximo goleador del torneo"
              resto={goleadores.slice(1).map(g => ({ ...g, valor: g.total, tag: 'goles' }))}
            />
        }

        {/* Valla Menos Vencida */}
        {valla.length === 0
          ? <Section title="Valla Menos Vencida" empty />
          : <HeroCard
              label="Valla Menos Vencida"
              labelColor="text-blue-400"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              heroEscudo={valla[0].escudo}
              heroNombre={valla[0].nombre}
              heroEquipo={`${valla[0].pj} partido${valla[0].pj !== 1 ? 's' : ''} jugado${valla[0].pj !== 1 ? 's' : ''}`}
              heroValor={valla[0].golesRecibidos}
              heroTag="En contra"
              heroBadge="Valla menos vencida del torneo"
              valorColor="text-blue-400"
              resto={valla.slice(1).map(v => ({ nombre: v.nombre, escudo: v.escudo, valor: v.golesRecibidos, tag: `en ${v.pj}P` }))}
            />
        }

        {/* Resto de secciones */}
        <Section title="Tarjetas Amarillas" empty={amarillas.length === 0}>
          <div className="bg-[#161616] rounded-2xl border border-white/8 overflow-hidden">
            {amarillas.map((a, i) => <RankRow key={i} pos={i + 1} nombre={a.nombre} numero={a.numero} equipo={a.equipo} escudo={a.escudo} valor={a.total} tag="amarillas" tagColor="text-yellow-400" />)}
          </div>
        </Section>

        <Section title="Tarjetas Rojas" empty={rojas.length === 0}>
          <div className="bg-[#161616] rounded-2xl border border-white/8 overflow-hidden">
            {rojas.map((r, i) => <RankRow key={i} pos={i + 1} nombre={r.nombre} numero={r.numero} equipo={r.equipo} escudo={r.escudo} valor={r.total} tag="rojas" tagColor="text-red-400" />)}
          </div>
        </Section>

        <Section title="Equipo Más Goleador" empty={equipoGoleador.length === 0}>
          <div className="bg-[#161616] rounded-2xl border border-white/8 overflow-hidden">
            {equipoGoleador.map((e, i) => <RankRow key={e.id} pos={i + 1} nombre={e.nombre} escudo={e.escudo} valor={e.goles} tag={`en ${e.pj}P`} tagColor="text-orange-400" />)}
          </div>
        </Section>

        <Section title="Equipo Más Goleado" empty={equipoGoleado.length === 0}>
          <div className="bg-[#161616] rounded-2xl border border-white/8 overflow-hidden">
            {equipoGoleado.map((e, i) => <RankRow key={e.id} pos={i + 1} nombre={e.nombre} escudo={e.escudo} valor={e.goles} tag={`en ${e.pj}P`} tagColor="text-red-400" />)}
          </div>
        </Section>

        <Section title="Hat-Tricks" empty={hatTricks.length === 0}>
          <div className="bg-[#161616] rounded-2xl border border-white/8 overflow-hidden">
            {hatTricks.map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                {h.escudo ? <img src={h.escudo} className="w-7 h-7 object-contain flex-shrink-0" /> : <div className="w-7 h-7 rounded bg-white/5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  {h.numero && <span className="text-[11px] font-black text-green-400/60">#{h.numero} </span>}
                  <span className="text-sm font-semibold text-white">{h.nombre}</span>
                  <p className="text-[10px] text-white/30 truncate">{h.equipo}{h.vs ? ` · vs ${h.vs}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-black text-yellow-400">{h.goles}</span>
                  <p className="text-[9px] text-white/30 uppercase">goles</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
