import { useState, useMemo } from 'react'

const FASES = [
  { id: 'liga', label: 'Liga' },
  { id: 'copa_oro', label: 'Copa de Oro' },
  { id: 'copa_plata', label: 'Copa de Plata' },
  { id: 'copa_bronce', label: 'Copa de Bronce' },
]

const ORO_FASES = ['oro_4tos', 'oro_semi', 'oro_final']
const PLATA_FASES = ['plata_semi', 'plata_final']
const BRONCE_FASES = ['bronce_4tos', 'bronce_semi', 'bronce_final']

const FASE_LABEL = {
  liga: 'Liga', oro_4tos: '4tos de Final', oro_semi: 'Semifinal', oro_final: 'Final',
  plata_semi: 'Semifinal', plata_final: 'Final', bronce_4tos: '4tos', bronce_semi: 'Semifinal', bronce_final: 'Final',
}

export default function Fixture({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}

  const [fase, setFase] = useState('liga')
  const [fechaSel, setFechaSel] = useState(null) // null = auto

  const fechasLiga = useMemo(() => {
    const nums = new Set(Object.values(partidos).filter(p => p.fase === 'liga').map(p => p.numero))
    return Array.from(nums).sort((a, b) => a - b)
  }, [partidos])

  // Fecha activa: primera con algún partido no jugado, o la última si todas están jugadas
  const fechaActiva = useMemo(() => {
    if (!fechasLiga.length) return 1
    for (const n of fechasLiga) {
      const ps = Object.values(partidos).filter(p => p.fase === 'liga' && Number(p.numero) === Number(n))
      if (ps.some(p => !p.jugado)) return n
    }
    return fechasLiga[fechasLiga.length - 1]
  }, [fechasLiga, partidos])

  const fechaMostrada = fechaSel ?? fechaActiva

  const partidosFiltrados = useMemo(() => {
    let list
    if (fase === 'liga') {
      list = Object.entries(partidos).filter(([, p]) => p.fase === 'liga' && Number(p.numero) === Number(fechaMostrada))
    } else if (fase === 'copa_oro') {
      list = Object.entries(partidos).filter(([, p]) => ORO_FASES.includes(p.fase))
    } else if (fase === 'copa_plata') {
      list = Object.entries(partidos).filter(([, p]) => PLATA_FASES.includes(p.fase))
    } else {
      list = Object.entries(partidos).filter(([, p]) => BRONCE_FASES.includes(p.fase))
    }
    return list.map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.numero || 0) - (b.numero || 0))
  }, [partidos, fase, fechaMostrada])

  // Agrupar copa por sub-fase
  const grupos = useMemo(() => {
    if (fase === 'liga') return null
    const g = {}
    partidosFiltrados.forEach(p => {
      const key = p.fase
      if (!g[key]) g[key] = []
      g[key].push(p)
    })
    return g
  }, [partidosFiltrados, fase])

  const formatFecha = str => {
    if (!str) return null
    try { return new Date(str).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) }
    catch { return null }
  }

  const formatHora = str => {
    if (!str) return null
    const t = str.split('T')[1]?.slice(0, 5)
    return (!t || t === '00:00') ? null : t
  }

  const PartidoCard = ({ p }) => {
    const eqLocal = equipos[p.local] || {}
    const eqVisitante = equipos[p.visitante] || {}
    const fecha = formatFecha(p.fechaHora)
    const hora = formatHora(p.fechaHora)
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/20">
        {(p.fechaHora || p.cancha) && (
          <div className="text-center mb-3">
            <p className="text-[11px] text-gray-500 capitalize">
              {fecha || 'Fecha a confirmar'}
              {p.cancha && <span className="ml-2 text-gray-600">· {p.cancha}</span>}
            </p>
            {hora && <p className="text-lg font-black text-white leading-tight mt-0.5">{hora}</p>}
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Local */}
          <div className="flex-1 flex flex-col items-end gap-1">
            {eqLocal.escudo && <img src={eqLocal.escudo} className="w-9 h-9 object-contain rounded" />}
            <p className="text-xs font-semibold text-right leading-tight">{eqLocal.nombre || (p.local ? '?' : 'A definir')}</p>
          </div>
          {/* Resultado o VS */}
          <div className="w-20 text-center flex-shrink-0">
            {p.jugado ? (
              <p className="text-2xl font-black text-white">{p.golesLocal ?? '?'} - {p.golesVisitante ?? '?'}</p>
            ) : (
              <p className="text-sm font-bold text-gray-600">VS</p>
            )}
          </div>
          {/* Visitante */}
          <div className="flex-1 flex flex-col items-start gap-1">
            {eqVisitante.escudo && <img src={eqVisitante.escudo} className="w-9 h-9 object-contain rounded" />}
            <p className="text-xs font-semibold leading-tight">{eqVisitante.nombre || (p.visitante ? '?' : 'A definir')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white mb-4">Fixture</h1>
        {/* Selector de fase */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FASES.map(f => (
            <button
              key={f.id}
              onClick={() => { setFase(f.id); if (f.id === 'liga') setFechaSel(null) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all
                ${fase === f.id ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Selector de fecha (solo liga) */}
        {fase === 'liga' && fechasLiga.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-3">
            {fechasLiga.map(n => (
              <button
                key={n}
                onClick={() => setFechaSel(n)}
                className={`w-10 h-10 rounded-full flex-shrink-0 text-sm font-bold transition-all
                  ${fechaMostrada === n ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-green-900/30'}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Partidos */}
        {fase === 'liga' ? (
          <div className="space-y-2">
            {partidosFiltrados.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Sin partidos cargados para esta fecha</p>
            ) : (
              partidosFiltrados.map(p => <PartidoCard key={p.id} p={p} />)
            )}
          </div>
        ) : (
          grupos && Object.keys(grupos).length === 0 ? (
            <p className="text-center text-gray-600 py-8">Sin partidos cargados</p>
          ) : (
            grupos && Object.entries(grupos).map(([subfase, ps]) => (
              <div key={subfase} className="mb-5">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">{FASE_LABEL[subfase] || subfase}</h3>
                <div className="space-y-2">
                  {ps.map(p => <PartidoCard key={p.id} p={p} />)}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
