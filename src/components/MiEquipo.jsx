import { useState, useMemo } from 'react'
import { calcTabla } from './Tabla'

function EscudoEq({ equipo, size = 'w-10 h-10' }) {
  if (equipo?.escudo) return <img src={equipo.escudo} className={`${size} object-contain`} />
  return (
    <div className={`${size} rounded-xl bg-green-900/20 flex items-center justify-center border border-white/5`}>
      <span className="text-green-400 text-[10px] font-bold">{(equipo?.nombre || '?').slice(0, 3).toUpperCase()}</span>
    </div>
  )
}

const TORNEO_LABEL = { sabados: 'Sábados · 1ra Ed.', sabados2: 'Sábados · 2da Ed.', domingos: 'Domingos' }

function fmtHora(str) {
  if (!str) return null
  if (str.includes('T')) return str.split('T')[1].slice(0, 5)
  return str
}

function fmtFecha(str) {
  if (!str) return null
  try { return new Date(str).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) }
  catch { return null }
}

export default function MiEquipo({ data, torneo, equipoId, onCambiarEquipo, onNavegar }) {
  const [tab, setTab] = useState('resumen')

  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  const jugadoresData = data.jugadores || {}

  const equipo = equipos[equipoId] || {}

  const misPartidos = useMemo(() => {
    return Object.entries(partidos)
      .map(([id, p]) => ({ id, ...p }))
      .filter(p => p.local === equipoId || p.visitante === equipoId)
      .sort((a, b) => {
        if (a.fechaHora && b.fechaHora) return a.fechaHora.localeCompare(b.fechaHora)
        return (a.numero || 0) - (b.numero || 0)
      })
  }, [partidos, equipoId])

  const jugados = useMemo(() => misPartidos.filter(p => p.jugado && p.fase === 'liga'), [misPartidos])

  const stats = useMemo(() => {
    let pts = 0, pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, gc = 0
    jugados.forEach(p => {
      const esLocal = p.local === equipoId
      const gm = Number(esLocal ? p.golesLocal : p.golesVisitante) || 0
      const go = Number(esLocal ? p.golesVisitante : p.golesLocal) || 0
      pj++; gf += gm; gc += go
      if (gm > go) { pg++; pts += 3 }
      else if (gm === go) { pe++; pts += 1 }
      else pp++
    })
    return { pts, pj, pg, pe, pp, gf, gc }
  }, [jugados, equipoId])

  const posicion = useMemo(() => {
    if (Object.keys(partidos).length === 0) return null
    const tabla = calcTabla(partidos, equipos)
    const idx = tabla.findIndex(r => r.id === equipoId)
    return idx >= 0 ? idx + 1 : null
  }, [partidos, equipos, equipoId])

  const ultimos5 = useMemo(() => {
    return [...jugados].reverse().slice(0, 5).map(p => {
      const esLocal = p.local === equipoId
      const gm = Number(esLocal ? p.golesLocal : p.golesVisitante) || 0
      const go = Number(esLocal ? p.golesVisitante : p.golesLocal) || 0
      return gm > go ? 'G' : gm === go ? 'E' : 'P'
    })
  }, [jugados, equipoId])

  const proximoPartido = useMemo(() => misPartidos.find(p => !p.jugado) || null, [misPartidos])
  const ultimoPartido = useMemo(() => [...jugados].reverse()[0] || null, [jugados])

  const plantel = useMemo(() => {
    const jugs = jugadoresData[equipoId] || {}
    return Object.entries(jugs)
      .map(([id, j]) => ({ id, ...j }))
      .sort((a, b) => (a.numero || 999) - (b.numero || 999))
  }, [jugadoresData, equipoId])

  const torneoLabel = TORNEO_LABEL[torneo] || torneo

  return (
    <div className="min-h-dvh text-white pb-[72px]">

      {/* Header del equipo */}
      <div className="bg-[#0a1a0c] border-b border-green-900/30">
        <div className="px-4 pt-12 pb-4">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium mb-3">Mi equipo</p>
          <div className="flex items-center gap-4 mb-4">
            <EscudoEq equipo={equipo} size="w-20 h-20" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h1 className="text-white font-black text-2xl leading-tight flex-1">{equipo.nombre || '?'}</h1>
                <button onClick={onCambiarEquipo} className="text-yellow-400 text-xl flex-shrink-0 active:opacity-60 transition-opacity">★</button>
              </div>
              <p className="text-white/40 text-sm mt-0.5">{torneoLabel}</p>
              <button
                onClick={onCambiarEquipo}
                className="mt-2 text-green-400 text-xs font-semibold active:opacity-70"
              >
                Cambiar equipo →
              </button>
            </div>
          </div>

          {/* Stats row: Posición / Puntos / Jugados */}
          <div className="grid grid-cols-3 divide-x divide-green-900/30 bg-[#0d1a0f] rounded-2xl">
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-white font-black text-2xl">{posicion != null ? `${posicion}°` : '—'}</span>
              <span className="text-white/40 text-xs">Posición Tabla</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-white font-black text-2xl">{stats.pts}</span>
              <span className="text-white/40 text-xs">Puntos</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-white font-black text-2xl">{stats.pj}</span>
              <span className="text-white/40 text-xs">Partidos Jugados</span>
            </div>
          </div>

          {/* Últimos resultados */}
          {ultimos5.length > 0 && (
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-white/30 text-xs">Últimos {ultimos5.length}</span>
              <div className="flex gap-1.5">
                {ultimos5.map((r, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                      ${r === 'G' ? 'bg-green-600' : r === 'E' ? 'bg-gray-600' : 'bg-red-600'}`}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-green-900/30">
          {['Resumen', 'Plantel', 'Partidos'].map(t => {
            const key = t.toLowerCase()
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors
                  ${tab === key ? 'text-green-400 border-b-2 border-green-400' : 'text-white/40'}`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido por tab */}
      <div className="px-4 py-4 space-y-4">

        {/* ─── RESUMEN ─── */}
        {tab === 'resumen' && (
          <>
            {proximoPartido && (
              <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-green-900/30">
                  <span className="text-green-400 text-xs font-black uppercase tracking-widest">Próximo partido</span>
                  {proximoPartido.numero && (
                    <span className="text-white/30 text-xs">Fecha {proximoPartido.numero}</span>
                  )}
                </div>
                <div className="px-4 py-5">
                  <div className="flex items-center">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <EscudoEq equipo={equipos[proximoPartido.local]} size="w-16 h-16" />
                      <span className="text-white font-bold text-xs text-center leading-tight line-clamp-2">
                        {equipos[proximoPartido.local]?.nombre || '?'}
                      </span>
                    </div>
                    <div className="px-3 flex-shrink-0">
                      <span className="text-white/30 font-bold text-2xl">VS</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <EscudoEq equipo={equipos[proximoPartido.visitante]} size="w-16 h-16" />
                      <span className="text-white font-bold text-xs text-center leading-tight line-clamp-2">
                        {equipos[proximoPartido.visitante]?.nombre || '?'}
                      </span>
                    </div>
                  </div>
                  {(proximoPartido.fechaHora || proximoPartido.hora || proximoPartido.cancha) && (
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-green-900/30">
                      {(fmtHora(proximoPartido.fechaHora) || proximoPartido.hora) && (
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 flex-shrink-0">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {fmtFecha(proximoPartido.fechaHora)
                            ? `${fmtFecha(proximoPartido.fechaHora)} · ${fmtHora(proximoPartido.fechaHora)}`
                            : fmtHora(proximoPartido.fechaHora) || proximoPartido.hora}
                        </div>
                      )}
                      {proximoPartido.cancha && (
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {proximoPartido.cancha}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {ultimoPartido && (
              <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-green-900/30">
                  <span className="text-white/50 text-xs font-black uppercase tracking-widest">Último partido</span>
                  {ultimoPartido.numero && (
                    <span className="text-white/30 text-xs">Fecha {ultimoPartido.numero}</span>
                  )}
                </div>
                <div className="px-4 py-5">
                  <div className="flex items-center">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <EscudoEq equipo={equipos[ultimoPartido.local]} size="w-12 h-12" />
                      <span className="text-white/70 text-xs text-center leading-tight line-clamp-2">
                        {equipos[ultimoPartido.local]?.nombre || '?'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-3 flex-shrink-0 gap-1">
                      <span className="bg-white/10 text-white/40 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Finalizado</span>
                      <span className="text-white font-black text-3xl tracking-tight">
                        {ultimoPartido.golesLocal} - {ultimoPartido.golesVisitante}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <EscudoEq equipo={equipos[ultimoPartido.visitante]} size="w-12 h-12" />
                      <span className="text-white/70 text-xs text-center leading-tight line-clamp-2">
                        {equipos[ultimoPartido.visitante]?.nombre || '?'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accesos rápidos */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: 'Resultados', sub: 'Todos los partidos',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={1.8} className="w-5 h-5"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9" strokeLinecap="round"/><line x1="7" y1="13" x2="14" y2="13" strokeLinecap="round"/></svg>,
                  action: () => setTab('partidos')
                },
                {
                  label: 'Fixture', sub: 'Próximas fechas',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={1.8} className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                  action: () => onNavegar?.('fixture')
                },
                {
                  label: 'Estadísticas', sub: 'Rendimiento del torneo',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={1.8} className="w-5 h-5"><rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="17" rx="1"/></svg>,
                  action: () => onNavegar?.('stats')
                }
              ].map(({ label, sub, icon, action }) => (
                <button key={label} onClick={action}
                  className="bg-[#161616] border border-green-900/30 rounded-2xl p-3 flex flex-col gap-2 text-left active:scale-95 transition-all active:border-green-600/40">
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-xl bg-green-900/20 flex items-center justify-center flex-shrink-0">{icon}</div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-white/20"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold leading-tight">{label}</p>
                    <p className="text-white/30 text-[10px] leading-tight mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* GF / GC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2} className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-2xl leading-none">{stats.gf}</p>
                  <p className="text-white/40 text-xs mt-0.5">Goles a favor</p>
                </div>
              </div>
              <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-2xl leading-none">{stats.gc}</p>
                  <p className="text-white/40 text-xs mt-0.5">Goles en contra</p>
                </div>
              </div>
            </div>

            {/* Mini tabla */}
            {(() => {
              const tabla = calcTabla(partidos, equipos)
              if (tabla.length === 0) return null
              const miPos = tabla.findIndex(r => r.id === equipoId)
              // Mostrar top 3 + el equipo si está fuera del top 3
              const indices = new Set([0, 1, 2, miPos].filter(i => i >= 0 && i < tabla.length))
              const rows = [...indices].sort((a, b) => a - b).map(i => ({ ...tabla[i], pos: i + 1 }))
              return (
                <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-green-900/30">
                    <span className="text-white font-bold text-sm">Así está la tabla</span>
                    <button onClick={() => onNavegar?.('tabla')} className="text-green-400 text-xs font-semibold flex items-center gap-1">
                      Ver tabla
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                  {/* Header */}
                  <div className="grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-4 py-1.5 border-b border-white/5">
                    {['#','EQUIPO','PJ','G','E','P','PTS'].map((h, i) => (
                      <span key={i} className={`text-white/30 text-[9px] font-bold uppercase ${i === 1 ? '' : 'text-center'}`}>{h}</span>
                    ))}
                  </div>
                  {rows.map((r, idx) => {
                    const esMio = r.id === equipoId
                    const prevPos = idx > 0 ? rows[idx - 1].pos : null
                    const gap = prevPos !== null && r.pos > prevPos + 1
                    return (
                      <div key={r.id}>
                        {gap && <div className="border-t border-dashed border-white/10 mx-4" />}
                        <div className={`grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-4 py-2.5 border-b border-white/5 last:border-0
                          ${esMio ? 'bg-green-900/10' : ''}`}>
                          <span className={`text-xs font-bold text-center ${esMio ? 'text-green-400' : 'text-white/40'}`}>{r.pos}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {r.escudo
                              ? <img src={r.escudo} className="w-5 h-5 object-contain flex-shrink-0" />
                              : <div className="w-5 h-5 rounded bg-white/5 flex-shrink-0" />
                            }
                            <span className={`text-xs font-semibold truncate ${esMio ? 'text-green-300' : 'text-white/80'}`}>{r.nombre}</span>
                          </div>
                          {[r.pj, r.pg, r.pe, r.pp].map((v, i) => (
                            <span key={i} className="text-white/50 text-xs text-center">{v}</span>
                          ))}
                          <span className={`text-xs font-black text-center ${esMio ? 'text-green-400' : 'text-white'}`}>{r.pts}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {!proximoPartido && !ultimoPartido && (
              <p className="text-white/30 text-sm text-center py-8">Sin partidos registrados</p>
            )}
          </>
        )}

        {/* ─── PLANTEL ─── */}
        {tab === 'plantel' && (
          <div className="space-y-3">
            {equipo.foto && (
              <div className="rounded-2xl overflow-hidden border border-green-900/30">
                <img src={equipo.foto} alt={equipo.nombre} className="w-full object-cover max-h-64" />
              </div>
            )}
            <div className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 overflow-hidden relative">
              {equipo.escudo && (
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none"
                  style={{ backgroundImage: `url(${equipo.escudo})`, opacity: 0.06 }}
                />
              )}
              {plantel.length === 0
                ? <p className="text-white/30 text-sm text-center py-8">Sin jugadores cargados</p>
                : plantel.map(j => (
                  <div key={j.id} className="relative flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-green-900/20 border border-green-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 text-xs font-bold">{j.numero ?? '?'}</span>
                    </div>
                    <span className="text-white text-sm font-medium">{j.nombre}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ─── PARTIDOS ─── */}
        {tab === 'partidos' && (
          <div className="space-y-2">
            {misPartidos.length === 0
              ? <p className="text-white/30 text-sm text-center py-8">Sin partidos</p>
              : [...misPartidos].reverse().map(p => {
                  const esLocal = p.local === equipoId
                  const rivalId = esLocal ? p.visitante : p.local
                  const gm = Number(esLocal ? p.golesLocal : p.golesVisitante) || 0
                  const go = Number(esLocal ? p.golesVisitante : p.golesLocal) || 0
                  const result = p.jugado ? (gm > go ? 'G' : gm === go ? 'E' : 'P') : null
                  return (
                    <div key={p.id} className="bg-[#0d1a0f] rounded-2xl border border-green-900/40 px-4 py-3 flex items-center gap-3">
                      {result
                        ? (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                            ${result === 'G' ? 'bg-green-600' : result === 'E' ? 'bg-gray-600' : 'bg-red-600'}`}>
                            {result}
                          </div>
                        )
                        : (
                          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                          </div>
                        )
                      }
                      <EscudoEq equipo={equipos[rivalId]} size="w-8 h-8" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{equipos[rivalId]?.nombre || '?'}</p>
                        <p className="text-white/30 text-xs">
                          {p.numero ? `Fecha ${p.numero}` : 'Fecha -'}
                        </p>
                      </div>
                      {p.jugado
                        ? <span className="text-white font-black text-sm flex-shrink-0">{gm} - {go}</span>
                        : <span className="text-white/30 text-sm flex-shrink-0">{fmtHora(p.fechaHora) || p.hora || '—'}</span>
                      }
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>
    </div>
  )
}
