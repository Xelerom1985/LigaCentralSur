import { useMemo } from 'react'

function calcTabla(partidos, equipos) {
  const stats = {}
  Object.values(equipos).forEach((_, idx) => {
    // init
  })
  Object.values(partidos)
    .filter(p => p.fase === 'liga' && p.jugado && p.golesLocal != null && p.golesVisitante != null && p.local && p.visitante)
    .forEach(p => {
      const gl = Number(p.golesLocal)
      const gv = Number(p.golesVisitante)
      if (!stats[p.local]) stats[p.local] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }
      if (!stats[p.visitante]) stats[p.visitante] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }
      stats[p.local].pj++; stats[p.visitante].pj++
      stats[p.local].gf += gl; stats[p.local].gc += gv
      stats[p.visitante].gf += gv; stats[p.visitante].gc += gl
      if (gl > gv) { stats[p.local].pg++; stats[p.local].pts += 3; stats[p.visitante].pp++ }
      else if (gl < gv) { stats[p.visitante].pg++; stats[p.visitante].pts += 3; stats[p.local].pp++ }
      else { stats[p.local].pe++; stats[p.local].pts++; stats[p.visitante].pe++; stats[p.visitante].pts++ }
    })

  // Incluir equipos sin partidos
  Object.keys(equipos).forEach(id => {
    if (!stats[id]) stats[id] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }
  })

  return Object.entries(stats)
    .map(([id, s]) => ({ id, nombre: equipos[id]?.nombre || id, escudo: equipos[id]?.escudo, dif: s.gf - s.gc, ...s }))
    .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf || a.nombre.localeCompare(b.nombre))
}

export default function Tabla({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}

  const tabla = useMemo(() => calcTabla(partidos, equipos), [partidos, equipos])

  if (Object.keys(equipos).length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p className="text-4xl mb-2">📊</p>
        <p>Aún no hay equipos registrados</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white">Tabla de Posiciones</h1>
        <p className="text-green-400 text-xs mt-1">Fase Liga · Fútbol 6</p>
      </div>

      <div className="px-3 pb-4">
        {/* Header tabla */}
        <div className="bg-[#111] rounded-t-xl px-3 py-2 border border-green-900/30">
          <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase">
            <span className="w-6 text-center">#</span>
            <span className="flex-1 ml-2">Equipo</span>
            <span className="w-7 text-center">PJ</span>
            <span className="w-7 text-center">PG</span>
            <span className="w-7 text-center">PE</span>
            <span className="w-7 text-center">PP</span>
            <span className="w-8 text-center">GF</span>
            <span className="w-8 text-center">GC</span>
            <span className="w-8 text-center">DIF</span>
            <span className="w-9 text-center font-black text-green-400">PTS</span>
          </div>
        </div>

        {/* Filas */}
        <div className="border-x border-b border-green-900/30 rounded-b-xl overflow-hidden">
          {tabla.map((eq, i) => {
            const esOro = i < 8
            const esBronce = i >= 8
            return (
              <div
                key={eq.id}
                className={`flex items-center px-3 py-2 border-b border-green-900/10 last:border-0
                  ${esOro ? 'bg-green-900/10' : esBronce ? 'bg-orange-900/5' : ''}`}
              >
                <span className={`w-6 text-center text-xs font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>{i + 1}</span>
                <div className="flex-1 ml-2 flex items-center gap-1.5 min-w-0">
                  {eq.escudo && <img src={eq.escudo} className="w-6 h-6 object-contain rounded flex-shrink-0" />}
                  <span className="text-xs font-semibold text-white truncate">{eq.nombre}</span>
                </div>
                <span className="w-7 text-center text-xs text-gray-400">{eq.pj}</span>
                <span className="w-7 text-center text-xs text-gray-400">{eq.pg}</span>
                <span className="w-7 text-center text-xs text-gray-400">{eq.pe}</span>
                <span className="w-7 text-center text-xs text-gray-400">{eq.pp}</span>
                <span className="w-8 text-center text-xs text-gray-400">{eq.gf}</span>
                <span className="w-8 text-center text-xs text-gray-400">{eq.gc}</span>
                <span className={`w-8 text-center text-xs font-medium ${eq.dif > 0 ? 'text-green-400' : eq.dif < 0 ? 'text-red-400' : 'text-gray-400'}`}>{eq.dif > 0 ? `+${eq.dif}` : eq.dif}</span>
                <span className="w-9 text-center text-sm font-black text-green-400">{eq.pts}</span>
              </div>
            )
          })}
        </div>

        {/* Clasificación */}
        <div className="mt-4 space-y-1 text-[11px] text-gray-500">
          <p>PG=ganados · PE=empatados · PP=perdidos · DIF=diferencia de gol</p>
        </div>
      </div>
    </div>
  )
}
