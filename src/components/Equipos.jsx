import { useState, useMemo, useRef, useEffect } from 'react'

function FotoModal({ src, onClose }) {
  const [t, setT] = useState({ s: 1, x: 0, y: 0 })
  const r = useRef({ s: 1, x: 0, y: 0, pinch: null, pan: null, lastTap: 0 })
  const divRef = useRef(null)

  const d2 = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  const commit = u => { Object.assign(r.current, u); setT({ s: r.current.s, x: r.current.x, y: r.current.y }) }

  useEffect(() => {
    const el = divRef.current
    const onStart = e => {
      e.preventDefault()
      const ts = e.touches
      if (ts.length === 1) {
        const now = Date.now()
        if (now - r.current.lastTap < 280) { commit({ s: 1, x: 0, y: 0 }); r.current.lastTap = 0; return }
        r.current.lastTap = now
        r.current.pan = { sx: ts[0].clientX, sy: ts[0].clientY, ox: r.current.x, oy: r.current.y }
      } else if (ts.length === 2) {
        r.current.pan = null
        r.current.pinch = { d0: d2(ts[0], ts[1]), s0: r.current.s }
      }
    }
    const onMove = e => {
      e.preventDefault()
      const ts = e.touches
      if (ts.length === 1 && r.current.pan && r.current.s > 1) {
        const { sx, sy, ox, oy } = r.current.pan
        commit({ x: ox + ts[0].clientX - sx, y: oy + ts[0].clientY - sy })
      } else if (ts.length === 2 && r.current.pinch) {
        const s = Math.min(5, Math.max(1, r.current.pinch.s0 * d2(ts[0], ts[1]) / r.current.pinch.d0))
        commit(s <= 1 ? { s: 1, x: 0, y: 0 } : { s })
      }
    }
    const onEnd = e => {
      if (e.touches.length < 2) r.current.pinch = null
      if (e.touches.length === 0) { r.current.pan = null; if (r.current.s <= 1) commit({ s: 1, x: 0, y: 0 }) }
    }
    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [])

  const zoomed = t.s > 1.05
  return (
    <div ref={divRef} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden touch-none">
      <img src={src} draggable={false}
        className="max-w-full max-h-dvh object-contain select-none pointer-events-none"
        style={{ transform: `translate(${t.x}px,${t.y}px) scale(${t.s})`, transition: zoomed ? 'none' : 'transform 0.2s' }}
      />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white text-lg flex items-center justify-center">✕</button>
      {zoomed
        ? <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap pointer-events-none">Doble toque para salir del zoom</p>
        : <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap pointer-events-none">Pellizcá para hacer zoom · Doble toque para cerrar</p>
      }
    </div>
  )
}
import { calcTabla } from './Tabla'

export default function Equipos({ data }) {
  const equipos = data.equipos || {}
  const jugadores = data.jugadores || {}
  const tablaMap = useMemo(() => {
    const t = calcTabla(data.partidos || {}, equipos)
    return Object.fromEntries(t.map((r, i) => [r.id, { pos: i + 1, pts: r.pts }]))
  }, [data.partidos, equipos])
  const [equipoId, setEquipoId] = useState(null)
  const [fotoAmpliada, setFotoAmpliada] = useState(null)

  if (equipoId) {
    const equipo = equipos[equipoId] || {}
    const jugs = Object.entries(jugadores[equipoId] || {})
      .map(([id, j]) => ({ id, ...j }))
      .sort((a, b) => (Number(a.numero) || 999) - (Number(b.numero) || 999))

    return (
      <div className="min-h-dvh">
        <div className="bg-gradient-to-b from-green-800/60 to-transparent px-4 pt-6 pb-5">
          <button
            onClick={() => setEquipoId(null)}
            className="flex items-center gap-1.5 text-green-400 text-sm mb-4 active:opacity-70"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Equipos
          </button>
          <div className="flex items-center gap-4">
            {equipo.escudo
              ? <img src={equipo.escudo} className="w-16 h-16 object-contain flex-shrink-0" />
              : <div className="w-16 h-16 rounded-full bg-green-900/20 flex items-center justify-center text-3xl flex-shrink-0">⚽</div>
            }
            <div>
              <h1 className="text-xl font-black text-white leading-tight">{equipo.nombre}</h1>
              <p className="text-green-400 text-xs mt-0.5">{jugs.length} jugadores · Liga Central Sur</p>
            </div>
          </div>
        </div>

        {equipo.foto && (
          <div className="px-4 pt-4">
            <button onClick={() => setFotoAmpliada(equipo.foto)} className="block w-full active:scale-[0.98] transition-transform">
              <img src={equipo.foto} className="w-full aspect-[4/3] rounded-xl border border-green-900/30 object-cover" />
              <p className="text-[10px] text-gray-500 text-center mt-1">Tocá la foto para agrandar</p>
            </button>
          </div>
        )}

        <div className="px-4 pb-4 pt-4 relative">
          {equipo.escudo && (
            <div
              className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-20 pointer-events-none"
              style={{ backgroundImage: `url(${equipo.escudo})` }}
            />
          )}
          {jugs.length === 0
            ? <p className="relative text-gray-600 text-sm text-center py-8 bg-[#1a1a1a] rounded-xl">Sin jugadores cargados</p>
            : (
              <div className="relative overflow-hidden rounded-xl">
                {jugs.map((j, i) => (
                  <div
                    key={j.id}
                    className={`flex items-center gap-3 px-4 py-3
                      ${i % 2 === 0 ? 'bg-[#161616]/90' : 'bg-[#1a1a1a]/90'}
                      ${i === 0 ? 'rounded-t-xl' : ''}
                      last:rounded-b-xl border-b border-green-900/10 last:border-0`}
                  >
                    <span className="w-10 text-center text-sm font-black text-green-400 flex-shrink-0">
                      {j.numero ? `#${j.numero}` : '–'}
                    </span>
                    <p className="text-sm font-semibold text-white">{j.nombre}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {fotoAmpliada && <FotoModal src={fotoAmpliada} onClose={() => setFotoAmpliada(null)} />}
      </div>
    )
  }

  const lista = Object.entries(equipos).filter(([, eq]) => !eq.retirado).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))

  return (
    <div className="min-h-dvh">
      <div className="bg-gradient-to-b from-green-800/60 to-transparent px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white">Equipos</h1>
        <p className="text-green-400 text-xs mt-1">Fútbol 6 · Liga Central Sur</p>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {lista.map(([id, eq]) => {
          const stat = tablaMap[id]
          return (
            <button
              key={id}
              onClick={() => setEquipoId(id)}
              className="bg-[#0d1a0f] border border-green-900/40 rounded-2xl p-3 flex items-center gap-2.5 text-left active:scale-95 transition-all"
            >
              {eq.escudo
                ? <img src={eq.escudo} className="w-12 h-12 object-contain flex-shrink-0" />
                : <div className="w-12 h-12 rounded-xl bg-green-900/20 flex items-center justify-center flex-shrink-0 text-xl">⚽</div>
              }
              <div className="min-w-0 flex-1">
                <p className="text-white text-[13px] font-bold leading-tight">{eq.nombre}</p>
                {stat && (
                  <>
                    <div className="border-t border-green-900/30 my-2" />
                    <div className="space-y-0.5">
                      <p className="text-white/50 text-xs leading-tight">
                        <span className="text-white font-bold">{stat.pos}°</span> posición
                      </p>
                      <p className="text-white/50 text-xs leading-tight">
                        <span className="text-white font-bold">{stat.pts}</span> puntos
                      </p>
                    </div>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
