import { useState, useMemo } from 'react'

const TABS_COPA = [
  { id: 'oro', label: '🥇 Copa de Oro', color: 'yellow' },
  { id: 'plata', label: '🥈 Copa de Plata', color: 'gray' },
  { id: 'bronce', label: '🥉 Copa de Bronce', color: 'orange' },
]

export default function Copas({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const [tab, setTab] = useState('oro')

  const getEq = id => equipos[id] || {}

  const getPartidosByFase = fase => Object.values(partidos).filter(p => p.fase === fase)

  const ResultCard = ({ p, rondaLabel }) => {
    if (!p) return (
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-dashed border-green-900/30 text-center text-gray-600 text-xs">
        {rondaLabel || 'A definir'}
      </div>
    )
    const local = getEq(p.local)
    const vis = getEq(p.visitante)
    const hayEquipos = p.local && p.visitante
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/20">
        {rondaLabel && <p className="text-[10px] text-green-500 font-bold uppercase mb-2">{rondaLabel}</p>}
        {(p.fechaHora || p.cancha) && (
          <p className="text-[10px] text-gray-500 mb-2">
            {p.fechaHora ? new Date(p.fechaHora).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            {p.cancha ? ` · ${p.cancha}` : ''}
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col items-end gap-1">
            {local.escudo && <img src={local.escudo} className="w-8 h-8 object-contain rounded" />}
            <p className={`text-xs font-semibold text-right ${p.jugado && p.golesLocal > p.golesVisitante ? 'text-green-400' : 'text-white'}`}>
              {local.nombre || (p.local ? '?' : 'A definir')}
            </p>
          </div>
          <div className="w-16 text-center flex-shrink-0">
            {p.jugado ? (
              <span className="text-xl font-black">{p.golesLocal} - {p.golesVisitante}</span>
            ) : (
              <span className="text-xs text-gray-600 font-bold">{hayEquipos ? 'VS' : '?'}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col items-start gap-1">
            {vis.escudo && <img src={vis.escudo} className="w-8 h-8 object-contain rounded" />}
            <p className={`text-xs font-semibold ${p.jugado && p.golesVisitante > p.golesLocal ? 'text-green-400' : 'text-white'}`}>
              {vis.nombre || (p.visitante ? '?' : 'A definir')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const BracketOro = () => {
    const cuartos = getPartidosByFase('oro_4tos').sort((a, b) => (a.numero || 0) - (b.numero || 0))
    const semis = getPartidosByFase('oro_semi').sort((a, b) => (a.numero || 0) - (b.numero || 0))
    const final = getPartidosByFase('oro_final')[0]
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Cuartos de Final</h3>
          <div className="space-y-2">
            {cuartos.length ? cuartos.map((p, i) => <ResultCard key={i} p={p} />) : <ResultCard rondaLabel="Sin datos" />}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Semifinales</h3>
          <div className="space-y-2">
            {semis.length ? semis.map((p, i) => <ResultCard key={i} p={p} />) : [0, 1].map(i => <ResultCard key={i} rondaLabel="Semi a definir" />)}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Final</h3>
          <ResultCard p={final} rondaLabel="Final a definir" />
        </div>
      </div>
    )
  }

  const BracketPlata = () => {
    const semis = getPartidosByFase('plata_semi').sort((a, b) => (a.numero || 0) - (b.numero || 0))
    const final = getPartidosByFase('plata_final')[0]
    return (
      <div className="space-y-4">
        <p className="text-[11px] text-gray-500 bg-[#1a1a1a] rounded-lg p-2">Los perdedores de cuartos de Copa de Oro disputan la Copa de Plata.</p>
        <div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Semifinales</h3>
          <div className="space-y-2">
            {semis.length ? semis.map((p, i) => <ResultCard key={i} p={p} />) : [0, 1].map(i => <ResultCard key={i} rondaLabel="Semi a definir" />)}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Final</h3>
          <ResultCard p={final} rondaLabel="Final a definir" />
        </div>
      </div>
    )
  }

  const BracketBronce = () => {
    const cuartos = getPartidosByFase('bronce_4tos').sort((a, b) => (a.numero || 0) - (b.numero || 0))
    const semis = getPartidosByFase('bronce_semi').sort((a, b) => (a.numero || 0) - (b.numero || 0))
    const final = getPartidosByFase('bronce_final')[0]
    const hayRondas = cuartos.length || semis.length || final
    return (
      <div className="space-y-4">
        <p className="text-[11px] text-gray-500 bg-[#1a1a1a] rounded-lg p-2">Equipos del 9° en adelante al terminar la fase de liga.</p>
        {!hayRondas && <p className="text-center text-gray-600 py-6">Sin partidos definidos aún</p>}
        {cuartos.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Cuartos</h3>
            <div className="space-y-2">{cuartos.map((p, i) => <ResultCard key={i} p={p} />)}</div>
          </div>
        )}
        {semis.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Semifinales</h3>
            <div className="space-y-2">{semis.map((p, i) => <ResultCard key={i} p={p} />)}</div>
          </div>
        )}
        {final && (
          <div>
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Final</h3>
            <ResultCard p={final} />
          </div>
        )}
      </div>
    )
  }

  const EsquemaCopas = () => (
    <div className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/30 mb-4">
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Cómo se juegan las copas</p>
      <table className="w-full text-center border-collapse table-fixed">
        <thead>
          <tr>
            <th className="text-[9px] text-gray-600 font-semibold pb-1.5 w-[19%]"></th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 1</th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 2</th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 3</th>
          </tr>
        </thead>
        <tbody className="text-[10px]">
          <tr>
            <td className="text-yellow-400 font-bold text-left pr-0.5">🥇 Oro</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">4tos<br />de Final</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">Semifinal</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">Final</td>
          </tr>
          <tr><td colSpan={4} className="h-1.5"></td></tr>
          <tr>
            <td className="text-gray-300 font-bold text-left pr-0.5">🥈 Plata</td>
            <td className="text-gray-600 py-2 px-0.5">No juega</td>
            <td className="bg-gray-500/10 rounded-lg py-2 px-0.5 text-white">Semifinal</td>
            <td className="bg-gray-500/10 rounded-lg py-2 px-0.5 text-white">Final</td>
          </tr>
          <tr><td colSpan={4} className="h-1.5"></td></tr>
          <tr>
            <td className="text-orange-400 font-bold text-left pr-0.5">🥉 Bronce</td>
            <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Semifinal</td>
            <td className="text-gray-600 py-2 px-0.5">No juega</td>
            <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Final</td>
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-gray-500 mt-2">Los perdedores de los 4tos de Oro pasan a jugar la Semifinal de Plata. Copa Bronce: los últimos 4 de la Liga.</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white mb-4">Copas</h1>
        <EsquemaCopas />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS_COPA.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all
                ${tab === t.id ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        {tab === 'oro' && <BracketOro />}
        {tab === 'plata' && <BracketPlata />}
        {tab === 'bronce' && <BracketBronce />}
      </div>
    </div>
  )
}
