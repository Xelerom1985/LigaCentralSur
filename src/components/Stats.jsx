import { useMemo } from 'react'

export default function Stats({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
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

  const goleadores = useMemo(() => {
    const cnt = {}
    Object.values(golesValidos).flatMap(Object.values).forEach(g => {
      if (!g.enContra && g.jugadorId && g.equipoId) {
        const key = `${g.equipoId}___${g.jugadorId}`
        cnt[key] = (cnt[key] || 0) + 1
      }
    })
    return Object.entries(cnt)
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
      .slice(0, 20)
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
      .map(([id, golesRecibidos]) => ({
        id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo,
        golesRecibidos, pj: pj[id] || 0
      }))
      .sort((a, b) => a.golesRecibidos - b.golesRecibidos)
      .slice(0, 10)
  }, [partidos, equipos])

  const amarillas = useMemo(() => {
    const cnt = {}
    Object.values(tarjetasValidas).flatMap(Object.values).filter(t => t.tipo === 'amarilla' && t.jugadorId && t.equipoId).forEach(t => {
      const key = `${t.equipoId}___${t.jugadorId}`
      cnt[key] = (cnt[key] || 0) + 1
    })
    return Object.entries(cnt).map(([key, total]) => {
      const [equipoId, jugadorId] = key.split('___')
      const jug = jugadores[equipoId]?.[jugadorId] || {}
      return { nombre: jug.nombre || '?', numero: jug.numero || '', equipo: equipos[equipoId]?.nombre || '', escudo: equipos[equipoId]?.escudo, total }
    }).sort((a, b) => b.total - a.total).slice(0, 10)
  }, [tarjetasValidas, jugadores, equipos])

  const rojas = useMemo(() => {
    const cnt = {}
    Object.values(tarjetasValidas).flatMap(Object.values).filter(t => t.tipo === 'roja' && t.jugadorId && t.equipoId).forEach(t => {
      const key = `${t.equipoId}___${t.jugadorId}`
      cnt[key] = (cnt[key] || 0) + 1
    })
    return Object.entries(cnt).map(([key, total]) => {
      const [equipoId, jugadorId] = key.split('___')
      const jug = jugadores[equipoId]?.[jugadorId] || {}
      return { nombre: jug.nombre || '?', numero: jug.numero || '', equipo: equipos[equipoId]?.nombre || '', escudo: equipos[equipoId]?.escudo, total }
    }).sort((a, b) => b.total - a.total).slice(0, 10)
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
      .map(([id, goles]) => ({ id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo, goles, pj: pj[id] || 0 }))
      .sort((a, b) => b.goles - a.goles)
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
      .map(([id, goles]) => ({ id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo, goles, pj: pj[id] || 0 }))
      .sort((a, b) => b.goles - a.goles)
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
        if (total >= 3) {
          const [equipoId, jugadorId] = key.split('___')
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
    return lista.sort((a, b) => b.goles - a.goles)
  }, [golesValidos, jugadores, equipos, partidos])

  const Section = ({ title, emoji, children, empty }) => (
    <section className="mb-6">
      <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">{emoji} {title}</h2>
      {empty ? (
        <p className="text-gray-600 text-sm text-center py-4 bg-[#1a1a1a] rounded-xl">Sin datos registrados</p>
      ) : children}
    </section>
  )

  const RankRow = ({ pos, nombre, numero, equipo, escudo, valor, tag, tagColor = 'text-green-400' }) => (
    <div className={`flex items-center gap-3 px-3 py-2.5 ${pos % 2 === 0 ? 'bg-[#161616]' : 'bg-[#1a1a1a]'} ${pos === 1 ? 'rounded-t-xl' : ''} last:rounded-b-xl border-b border-green-900/10 last:border-0`}>
      <span className={`w-6 text-center text-xs font-black flex-shrink-0 ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-gray-300' : pos === 3 ? 'text-orange-400' : 'text-gray-500'}`}>{pos}</span>
      {escudo ? <img src={escudo} className="w-7 h-7 object-contain rounded flex-shrink-0" /> : <div className="w-7 h-7 rounded bg-green-900/20 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">⚽</div>}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          {numero && <span className="text-[11px] font-black text-green-400/60 flex-shrink-0">#{numero}</span>}
          <p className="text-sm font-semibold text-white truncate">{nombre}</p>
        </div>
        {equipo && <p className="text-[10px] text-gray-500 truncate">{equipo}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-lg font-black ${tagColor}`}>{valor}</span>
        {tag && <p className="text-[9px] text-gray-500 uppercase">{tag}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white">Estadísticas</h1>
        <p className="text-green-400 text-xs mt-1">Fútbol 6 · Liga Central Sur</p>
      </div>
      <div className="px-4 pb-4">
        <Section title="Máximo Goleador" emoji="⚽" empty={goleadores.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {goleadores.map((g, i) => <RankRow key={i} pos={i + 1} nombre={g.nombre} numero={g.numero} equipo={g.equipo} escudo={g.escudo} valor={g.total} tag="goles" />)}
          </div>
        </Section>

        <Section title="Valla Menos Vencida" emoji="🧤" empty={valla.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {valla.map((v, i) => <RankRow key={i} pos={i + 1} nombre={v.nombre} escudo={v.escudo} valor={v.golesRecibidos} tag={`en ${v.pj} partidos`} tagColor="text-blue-400" />)}
          </div>
        </Section>

        <Section title="Tarjetas Amarillas" emoji="🟨" empty={amarillas.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {amarillas.map((a, i) => <RankRow key={i} pos={i + 1} nombre={a.nombre} numero={a.numero} equipo={a.equipo} escudo={a.escudo} valor={a.total} tag="amarillas" tagColor="text-yellow-400" />)}
          </div>
        </Section>

        <Section title="Tarjetas Rojas" emoji="🟥" empty={rojas.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {rojas.map((r, i) => <RankRow key={i} pos={i + 1} nombre={r.nombre} numero={r.numero} equipo={r.equipo} escudo={r.escudo} valor={r.total} tag="rojas" tagColor="text-red-400" />)}
          </div>
        </Section>

        <Section title="Equipo Más Goleador" emoji="🔥" empty={equipoGoleador.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {equipoGoleador.map((e, i) => (
              <RankRow key={e.id} pos={i + 1} nombre={e.nombre} escudo={e.escudo} valor={e.goles} tag={`en ${e.pj} partidos`} tagColor="text-orange-400" />
            ))}
          </div>
        </Section>

        <Section title="Equipo Más Goleado" emoji="😬" empty={equipoGoleado.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {equipoGoleado.map((e, i) => (
              <RankRow key={e.id} pos={i + 1} nombre={e.nombre} escudo={e.escudo} valor={e.goles} tag={`en ${e.pj} partidos`} tagColor="text-red-400" />
            ))}
          </div>
        </Section>

        <Section title="Hat-Tricks" emoji="🎩" empty={hatTricks.length === 0}>
          <div className="overflow-hidden rounded-xl">
            {hatTricks.map((h, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 ${i % 2 === 0 ? 'bg-[#161616]' : 'bg-[#1a1a1a]'} ${i === 0 ? 'rounded-t-xl' : ''} last:rounded-b-xl border-b border-green-900/10 last:border-0`}>
                {h.escudo ? <img src={h.escudo} className="w-7 h-7 object-contain rounded flex-shrink-0" /> : <div className="w-7 h-7 rounded bg-green-900/20 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1">
                    {h.numero && <span className="text-[11px] font-black text-green-400/60 flex-shrink-0">#{h.numero}</span>}
                    <p className="text-sm font-semibold text-white truncate">{h.nombre}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{h.equipo}{h.vs ? ` · vs ${h.vs}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-black text-yellow-400">{h.goles}</span>
                  <p className="text-[9px] text-gray-500 uppercase">goles</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
