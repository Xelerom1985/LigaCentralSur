import { useMemo, useState, useRef, useEffect } from 'react'

function Lightbox({ src, onClose }) {
  const imgRef = useRef(null)
  const st = useRef({ scale: 1, x: 0, y: 0, d0: 0, ox: 0, oy: 0 })
  const [, tick] = useState(0)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = e => {
      if (e.touches.length === 2) st.current.d0 = dist(e.touches)
      else { st.current.ox = e.touches[0].clientX - st.current.x; st.current.oy = e.touches[0].clientY - st.current.y }
    }
    const onMove = e => {
      e.preventDefault()
      const s = st.current
      if (e.touches.length === 2) {
        const d = dist(e.touches)
        s.scale = Math.min(Math.max(s.scale * d / s.d0, 1), 5)
        s.d0 = d
      } else if (s.scale > 1) {
        s.x = e.touches[0].clientX - s.ox
        s.y = e.touches[0].clientY - s.oy
      }
      tick(n => n + 1)
    }
    const onEnd = () => {
      if (st.current.scale < 1.05) { st.current = { ...st.current, scale: 1, x: 0, y: 0 }; tick(n => n + 1) }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [])

  const { scale, x, y } = st.current
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden"
      onClick={scale <= 1 ? onClose : undefined}
    >
      <img
        ref={imgRef}
        src={src}
        className="max-w-full max-h-full object-contain select-none"
        style={{ transform: `scale(${scale}) translate(${x / scale}px, ${y / scale}px)`, touchAction: 'none' }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white text-lg flex items-center justify-center">
        ✕
      </button>
    </div>
  )
}

export default function Home({ data }) {
  const equipos  = data.equipos  || {}
  const partidos = data.partidos || {}
  const novedades = data.novedades || {}
  const homeFecha = data.home_fecha ?? null
  const [lightbox, setLightbox] = useState(null)

  const fechaPartidos = useMemo(() => {
    if (!homeFecha) return []
    return Object.entries(partidos)
      .filter(([, p]) => p.fase === 'liga' && Number(p.numero) === Number(homeFecha))
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => {
        const ha = a.fechaHora ? a.fechaHora.split('T')[1]?.slice(0,5) : (a.hora || '99:99')
        const hb = b.fechaHora ? b.fechaHora.split('T')[1]?.slice(0,5) : (b.hora || '99:99')
        return ha.localeCompare(hb)
      })
  }, [partidos, homeFecha])

  const novedadesList = useMemo(() =>
    Object.entries(novedades)
      .map(([id, n]) => ({ id, ...n }))
      .sort((a, b) => b.orden - a.orden)
  , [novedades])

  const fmtHora = str => {
    if (!str) return null
    const t = str.split('T')[1]?.slice(0, 5)
    if (!t || t === '00:00') return null
    return t
  }

  const fechaLabel = useMemo(() => {
    const p = fechaPartidos.find(f => f.fechaHora)
    if (!p?.fechaHora) return null
    try {
      return new Date(p.fechaHora).toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short'
      })
    } catch { return null }
  }, [fechaPartidos])

  const hasOverlay = homeFecha || novedadesList.length > 0

  return (
    <div className="relative min-h-screen">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fondo-inicio.png')" }}
      />

      {/* Gradiente siempre presente (cubre el footer al menos) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />

      {/* Contenido fixture + novedades */}
      {hasOverlay && (
        <div className="absolute inset-x-0 top-[24%] bottom-[72px] px-4 pb-3 pt-2 space-y-3 overflow-y-auto">

          {homeFecha && fechaPartidos.length > 0 && (
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-green-400 text-xs font-black uppercase tracking-widest">
                  Fecha {homeFecha} · Liga Central Sur
                </span>
                {fechaLabel && (
                  <span className="text-gray-400 text-xs capitalize">{fechaLabel}</span>
                )}
              </div>
              <div className="divide-y divide-white/5">
                {fechaPartidos.map(p => {
                  const hora = fmtHora(p.fechaHora)
                  return (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span className="text-white text-xs font-bold truncate">{equipos[p.local]?.nombre || '?'}</span>
                      {equipos[p.local]?.escudo
                        ? <img src={equipos[p.local].escudo} className="w-8 h-8 object-contain rounded flex-shrink-0" />
                        : <div className="w-8 h-8 rounded bg-green-900/30 flex-shrink-0" />}
                    </div>
                    <div className="flex-shrink-0 text-center w-20">
                      {p.jugado ? (
                        <>
                          <p className="text-white font-black text-xl leading-tight">{p.golesLocal} - {p.golesVisitante}</p>
                          {hora && <p className="text-green-400/50 text-[10px] leading-tight mt-1">{hora}</p>}
                        </>
                      ) : hora ? (
                        <p className="text-white font-black text-xl leading-tight">{hora}</p>
                      ) : (
                        <p className="text-gray-500 text-sm font-bold">vs</p>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {equipos[p.visitante]?.escudo
                        ? <img src={equipos[p.visitante].escudo} className="w-8 h-8 object-contain rounded flex-shrink-0" />
                        : <div className="w-8 h-8 rounded bg-green-900/30 flex-shrink-0" />}
                      <span className="text-white text-xs font-bold truncate">{equipos[p.visitante]?.nombre || '?'}</span>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {novedadesList.map(n => (
            <div key={n.id} className="bg-black/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              {n.imagen && (
                <img
                  src={n.imagen}
                  className="w-full h-auto object-contain cursor-pointer"
                  onClick={() => setLightbox(n.imagen)}
                />
              )}
              <div className="px-4 py-3">
                <p className="text-white font-bold text-sm">{n.titulo}</p>
                {n.detalle && <p className="text-gray-300 text-xs mt-1 leading-relaxed">{n.detalle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer: Redes + Contacto — siempre visible */}
      <div className="absolute bottom-0 inset-x-0 px-4 pb-3">

        {/* Fila 1: labels — col 1 "Nuestras Redes", cols 2-3 "Contáctanos · Organizadores" */}
        <div className="grid grid-cols-3 mb-2">
          <div className="text-center text-[9px] text-white/50 font-semibold uppercase tracking-wide">Nuestras Redes</div>
          <div className="col-span-2 text-center text-[9px] text-white/50 font-semibold uppercase tracking-wide">Contáctanos · Organizadores</div>
        </div>

        {/* Fila 2: íconos — misma fila de grid = mismo nivel */}
        <div className="grid grid-cols-3">
          <div className="flex justify-center">
            <a href="https://www.instagram.com/ligacentralsur/" target="_blank" rel="noopener noreferrer">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
            </a>
          </div>
          <div className="flex justify-center">
            <a href="https://wa.me/5491176111218" target="_blank" rel="noopener noreferrer">
              <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            </a>
          </div>
          <div className="flex justify-center">
            <a href="https://wa.me/5491124098948" target="_blank" rel="noopener noreferrer">
              <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            </a>
          </div>
        </div>

        {/* Fila 3: nombres — invisible para Instagram, visible para Fernando/Sasha */}
        <div className="grid grid-cols-3 mt-1">
          <div className="text-center text-[9px] text-transparent select-none">·</div>
          <div className="text-center text-[9px] text-white/40">Fernando</div>
          <div className="text-center text-[9px] text-white/40">Sasha</div>
        </div>

        {/* Crédito desarrollador */}
        <p className="text-center text-[9px] text-white/20 mt-1">App desarrollada por Fernando Flores</p>

      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

    </div>
  )
}
