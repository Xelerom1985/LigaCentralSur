export default function Copas({ data }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}

  const getEq = id => equipos[id] || {}
  // El campo "slot" (opcional) permite fijar a mano el orden/lado de cada cruce dentro del cuadro
  const getPartidosByFase = fase => Object.values(partidos)
    .filter(p => p.fase === fase)
    .sort((a, b) => (a.slot ?? a.numero ?? 0) - (b.slot ?? b.numero ?? 0))

  const TeamRow = ({ id }) => {
    const eq = getEq(id)
    return (
      <div className="team-row">
        {eq.escudo && <img src={eq.escudo} alt={eq.nombre} />}
        <span>{eq.nombre || (id ? '?' : 'A definir')}</span>
      </div>
    )
  }

  const MatchBox = ({ p, connClass }) => (
    <div className={`match-box ${connClass || ''}`}>
      <TeamRow id={p?.local} />
      <TeamRow id={p?.visitante} />
    </div>
  )

  const TbdSlot = ({ p, label, connClass }) => {
    if (p && (p.local || p.visitante)) {
      return (
        <div className={`match-box ${connClass || ''}`}>
          <TeamRow id={p.local} />
          <TeamRow id={p.visitante} />
        </div>
      )
    }
    return (
      <div className={`tbd-slot ${connClass || ''}`}>
        <span>{label}</span>
      </div>
    )
  }

  const SeccionTitulo = ({ children }) => (
    <h2 className="text-sm font-black text-white uppercase tracking-widest mb-3 pt-2">{children}</h2>
  )

  // Cuadro horizontal (cuartos -> semifinal -> final <- semifinal <- cuartos), como Copa Argentina
  const BracketOro = () => {
    const cuartos = getPartidosByFase('oro_4tos')
    const semis = getPartidosByFase('oro_semi')
    const final = getPartidosByFase('oro_final')[0]
    return (
      <div className="bracket-scroll">
        <div className="bracket-row">
          <div className="col-wrap">
            <p className="col-label">Cuartos</p>
            <div className="col col-cuartos">
              <MatchBox p={cuartos[0]} connClass="conn-r-up" />
              <MatchBox p={cuartos[1]} connClass="conn-r-down" />
            </div>
          </div>

          <div className="col-wrap">
            <p className="col-label">Semifinal</p>
            <div className="col col-semi">
              <TbdSlot p={semis[0]} label="Semifinal 1" connClass="conn-r" />
            </div>
          </div>

          <div className="col-wrap">
            <p className="col-label">Final</p>
            <div className="col col-final">
              <div className="trophy-wrap">
                <span className="trophy">🏆</span>
                <TbdSlot p={final} label="Final" />
              </div>
            </div>
          </div>

          <div className="col-wrap">
            <p className="col-label">Semifinal</p>
            <div className="col col-semi">
              <TbdSlot p={semis[1]} label="Semifinal 2" connClass="conn-l" />
            </div>
          </div>

          <div className="col-wrap">
            <p className="col-label">Cuartos</p>
            <div className="col col-cuartos">
              <MatchBox p={cuartos[2]} connClass="conn-l-up" />
              <MatchBox p={cuartos[3]} connClass="conn-l-down" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const BracketPlata = () => {
    const semis = getPartidosByFase('plata_semi')
    const final = getPartidosByFase('plata_final')[0]
    const hayEquipos = semis.length > 0
    if (!hayEquipos) {
      return (
        <div className="bg-[#1a1a1a] border border-dashed border-green-900/30 rounded-2xl px-4 py-5 text-center">
          <p className="text-xl mb-2 opacity-50">🥈</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Todavía sin equipos.<br />Se completa con los perdedores de los cuartos de Copa de Oro.
          </p>
        </div>
      )
    }
    return (
      <div className="bracket-scroll">
        <div className="bracket-row bracket-row-3">
          <div className="col-wrap">
            <p className="col-label">Semifinal</p>
            <div className="col col-semi" style={{ height: 'var(--boxh)' }}>
              <TbdSlot p={semis[0]} label="Semifinal 1" connClass="conn-r" />
            </div>
          </div>
          <div className="col-wrap">
            <p className="col-label">Final</p>
            <div className="col col-final" style={{ height: 'var(--boxh)' }}>
              <div className="trophy-wrap">
                <span className="trophy" style={{ background: 'rgba(199,204,212,0.12)', borderColor: 'rgba(199,204,212,0.4)' }}>🥈</span>
                <TbdSlot p={final} label="Final" />
              </div>
            </div>
          </div>
          <div className="col-wrap">
            <p className="col-label">Semifinal</p>
            <div className="col col-semi" style={{ height: 'var(--boxh)' }}>
              <TbdSlot p={semis[1]} label="Semifinal 2" connClass="conn-l" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Cuadro horizontal simplificado: semifinal -> final <- semifinal (sin cuartos)
  const BracketBronce = () => {
    const semis = getPartidosByFase('bronce_semi')
    const final = getPartidosByFase('bronce_final')[0]
    return (
      <div className="bracket-scroll">
        <div className="bracket-row bracket-row-3">
          <div className="col-wrap">
            <p className="col-label">Semifinal</p>
            <div className="col col-semi" style={{ height: 'var(--boxh)' }}>
              <TbdSlot p={semis[0]} label="Semifinal 1" connClass="conn-r" />
            </div>
          </div>
          <div className="col-wrap">
            <p className="col-label">Final</p>
            <div className="col col-final" style={{ height: 'var(--boxh)' }}>
              <div className="trophy-wrap">
                <span className="trophy trophy-bronce">🏆</span>
                <TbdSlot p={final} label="Final" />
              </div>
            </div>
          </div>
          <div className="col-wrap">
            <p className="col-label">Semifinal</p>
            <div className="col col-semi" style={{ height: 'var(--boxh)' }}>
              <TbdSlot p={semis[1]} label="Semifinal 2" connClass="conn-l" />
            </div>
          </div>
        </div>
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
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3">
          <p className="text-xs text-yellow-200 leading-relaxed">
            <span className="font-bold">⚠️ Los cruces son al azar.</span> No se arman por posición en la tabla (1° vs último, 2° vs anteúltimo, etc.) — la app sortea los cruces entre los equipos que participan en cada copa (Oro, Plata y Bronce).
          </p>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        <div>
          <SeccionTitulo>🥇 Copa de Oro</SeccionTitulo>
          <BracketOro />
        </div>

        <div>
          <SeccionTitulo>🥈 Copa de Plata</SeccionTitulo>
          <BracketPlata />
        </div>

        <div>
          <SeccionTitulo>🥉 Copa de Bronce</SeccionTitulo>
          <BracketBronce />
        </div>
      </div>
    </div>
  )
}
