import { useMemo } from 'react'

export default function Home({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const novedades = data.novedades || {}

  const proximos = useMemo(() => {
    return Object.entries(partidos)
      .filter(([, p]) => !p.jugado && p.fechaHora && p.local && p.visitante)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
      .slice(0, 6)
  }, [partidos])

  const ultimos = useMemo(() => {
    return Object.entries(partidos)
      .filter(([, p]) => p.jugado && p.golesLocal != null)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => (b.fechaHora || '').localeCompare(a.fechaHora || ''))
      .slice(0, 4)
  }, [partidos])

  const novedadesList = useMemo(() => {
    return Object.entries(novedades)
      .map(([id, n]) => ({ id, ...n }))
      .sort((a, b) => b.orden - a.orden)
  }, [novedades])

  const faseLabel = f => {
    const m = { liga: 'Liga', oro_4tos: 'Copa de Oro · 4tos', oro_semi: 'Copa de Oro · Semi', oro_final: 'Copa de Oro · Final', plata_semi: 'Copa de Plata · Semi', plata_final: 'Copa de Plata · Final', bronce_4tos: 'Copa de Bronce · 4tos', bronce_semi: 'Copa de Bronce · Semi', bronce_final: 'Copa de Bronce · Final' }
    return m[f] || f
  }

  const formatFechaHora = str => {
    if (!str) return ''
    try {
      return new Date(str).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch { return str }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-900/60 to-[#0a0a0a] pt-6 pb-4 px-4 text-center">
        <img src="/logo.png" alt="Liga Central Sur" className="w-24 h-24 object-contain mx-auto mb-2 drop-shadow-lg" />
        <h1 className="text-2xl font-black text-white tracking-tight">LIGA CENTRAL SUR</h1>
        <p className="text-green-400 text-sm font-medium">Fútbol 6 · 1ª Edición 2026</p>
      </div>

      <div className="px-4 space-y-6 pb-4">
        {/* Próximos partidos */}
        {proximos.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Próximos Partidos</h2>
            <div className="space-y-2">
              {proximos.map(p => (
                <div key={p.id} className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-green-500 font-semibold uppercase">{faseLabel(p.fase)}{p.numero ? ` · F${p.numero}` : ''}</span>
                    {p.cancha && <span className="text-[10px] text-gray-500">{p.cancha}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-right">
                      {equipos[p.local]?.escudo && <img src={equipos[p.local].escudo} className="w-8 h-8 object-contain ml-auto mb-1 rounded" />}
                      <p className="text-sm font-semibold text-white leading-tight">{equipos[p.local]?.nombre || '—'}</p>
                    </div>
                    <div className="text-center px-2">
                      <p className="text-[10px] text-gray-400 font-medium">{formatFechaHora(p.fechaHora)}</p>
                    </div>
                    <div className="flex-1 text-left">
                      {equipos[p.visitante]?.escudo && <img src={equipos[p.visitante].escudo} className="w-8 h-8 object-contain mb-1 rounded" />}
                      <p className="text-sm font-semibold text-white leading-tight">{equipos[p.visitante]?.nombre || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimos resultados */}
        {ultimos.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Últimos Resultados</h2>
            <div className="space-y-2">
              {ultimos.map(p => (
                <div key={p.id} className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-500 uppercase">{faseLabel(p.fase)}{p.numero ? ` · F${p.numero}` : ''}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 text-right">
                      {equipos[p.local]?.escudo && <img src={equipos[p.local].escudo} className="w-8 h-8 object-contain ml-auto mb-1 rounded" />}
                      <p className={`text-sm font-semibold leading-tight ${p.golesLocal > p.golesVisitante ? 'text-green-400' : 'text-gray-300'}`}>{equipos[p.local]?.nombre || '—'}</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xl font-black text-white">{p.golesLocal} - {p.golesVisitante}</p>
                    </div>
                    <div className="flex-1">
                      {equipos[p.visitante]?.escudo && <img src={equipos[p.visitante].escudo} className="w-8 h-8 object-contain mb-1 rounded" />}
                      <p className={`text-sm font-semibold leading-tight ${p.golesVisitante > p.golesLocal ? 'text-green-400' : 'text-gray-300'}`}>{equipos[p.visitante]?.nombre || '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Novedades */}
        {novedadesList.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Novedades</h2>
            <div className="space-y-3">
              {novedadesList.map(n => (
                <div key={n.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-green-900/30">
                  {n.imagen && <img src={n.imagen} className="w-full h-40 object-cover" />}
                  <div className="p-3">
                    <p className="font-bold text-white mb-1">{n.titulo}</p>
                    {n.detalle && <p className="text-sm text-gray-400 leading-relaxed">{n.detalle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {proximos.length === 0 && ultimos.length === 0 && novedadesList.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">⚽</p>
            <p>El torneo está por comenzar</p>
          </div>
        )}
      </div>
    </div>
  )
}
