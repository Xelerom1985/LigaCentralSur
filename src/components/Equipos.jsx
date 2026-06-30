import { useState } from 'react'

export default function Equipos({ data }) {
  const equipos = data.equipos || {}
  const jugadores = data.jugadores || {}
  const [equipoId, setEquipoId] = useState(null)

  if (equipoId) {
    const equipo = equipos[equipoId] || {}
    const jugs = Object.entries(jugadores[equipoId] || {})
      .map(([id, j]) => ({ id, ...j }))
      .sort((a, b) => (Number(a.numero) || 999) - (Number(b.numero) || 999))

    return (
      <div className="min-h-screen">
        <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-5">
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

        <div className="px-4 pb-4">
          {jugs.length === 0
            ? <p className="text-gray-600 text-sm text-center py-8 bg-[#1a1a1a] rounded-xl">Sin jugadores cargados</p>
            : (
              <div className="overflow-hidden rounded-xl">
                {jugs.map((j, i) => (
                  <div
                    key={j.id}
                    className={`flex items-center gap-3 px-4 py-3
                      ${i % 2 === 0 ? 'bg-[#161616]' : 'bg-[#1a1a1a]'}
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
      </div>
    )
  }

  const lista = Object.entries(equipos).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white">Equipos</h1>
        <p className="text-green-400 text-xs mt-1">Fútbol 6 · Liga Central Sur</p>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {lista.map(([id, eq]) => (
          <button
            key={id}
            onClick={() => setEquipoId(id)}
            className="bg-[#1a1a1a] border border-green-900/20 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-95 transition-all"
          >
            {eq.escudo
              ? <img src={eq.escudo} className="w-16 h-16 object-contain" />
              : <div className="w-16 h-16 rounded-full bg-green-900/20 flex items-center justify-center text-3xl">⚽</div>
            }
            <p className="text-white text-sm font-bold text-center leading-tight">{eq.nombre}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
