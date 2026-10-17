import { cuartosIdaVuelta, seriesDeCopa, resultadoSerie } from '../copasSeries'

export default function Copas({ data, torneo }) {
  const equipos = data.equipos || {}
  const partidos = data.partidos || {}
  // Sábados 2da y Domingos: los cuartos de final se juegan a ida y vuelta
  const idaVuelta = cuartosIdaVuelta(torneo)

  const getEq = id => equipos[id] || {}
  // El campo "slot" (opcional) permite fijar a mano el orden/lado de cada cruce dentro del cuadro
  const getPartidosByFase = fase => Object.values(partidos)
    .filter(p => p.fase === fase)
    .sort((a, b) => (a.slot ?? a.numero ?? 0) - (b.slot ?? b.numero ?? 0))

  const TeamRow = ({ id, goles, gana }) => {
    const eq = getEq(id)
    return (
      <div className={`team-row${gana ? ' team-gana' : ''}`}>
        {eq.escudo && <img src={eq.escudo} alt={eq.nombre} />}
        <span>{eq.nombre || (id ? '?' : 'A definir')}</span>
        {goles != null && <b className="serie-goles">{goles}</b>}
      </div>
    )
  }

  // Cruce de cuartos a ida y vuelta: muestra el global (suma de los dos partidos) a la derecha de cada equipo
  const SerieBox = ({ serie, connClass }) => {
    if (!serie) return <MatchBox connClass={connClass} />
    const r = resultadoSerie(serie)
    const hayGoles = !!serie.ida?.jugado
    return (
      <div className={`match-box ${connClass || ''}`}>
        <TeamRow id={r.A} goles={hayGoles ? r.golesA : null} gana={!!r.ganador && r.ganador === r.A} />
        <TeamRow id={r.B} goles={hayGoles ? r.golesB : null} gana={!!r.ganador && r.ganador === r.B} />
        {r.aPenales && r.ganador && <span className="serie-pen">PEN {r.penalesA}-{r.penalesB}</span>}
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
  // Cuadro horizontal completo de 8 equipos: cuartos -> semifinal -> final <- semifinal <- cuartos
  const BracketCompleto = ({ prefijo, trofeoClase }) => {
    const cuartos = getPartidosByFase(prefijo + '_4tos')
    const semis = getPartidosByFase(prefijo + '_semi')
    const final = getPartidosByFase(prefijo + '_final')[0]
    const series = idaVuelta ? seriesDeCopa(partidos, prefijo) : []
    const Cuarto = ({ i, connClass }) => idaVuelta
      ? <SerieBox serie={series[i]} connClass={connClass} />
      : <MatchBox p={cuartos[i]} connClass={connClass} />
    return (
      <div className="bracket-scroll">
        <div className="bracket-row">
          <div className="col-wrap">
            <p className="col-label">{idaVuelta ? 'Cuartos (global)' : 'Cuartos'}</p>
            <div className="col col-cuartos">
              <Cuarto i={0} connClass="conn-r-up" />
              <Cuarto i={1} connClass="conn-r-down" />
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
                <span className={trofeoClase}>🏆</span>
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
            <p className="col-label">{idaVuelta ? 'Cuartos (global)' : 'Cuartos'}</p>
            <div className="col col-cuartos">
              <Cuarto i={2} connClass="conn-l-up" />
              <Cuarto i={3} connClass="conn-l-down" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const BracketOro = () => <BracketCompleto prefijo="oro" trofeoClase="trophy" />

  const BracketPlata = () => {
    const semis = getPartidosByFase('plata_semi')
    const final = getPartidosByFase('plata_final')[0]
    const hayEquipos = semis.length > 0
    if (!hayEquipos && torneo !== 'sabados2' && torneo !== 'domingos') {
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

  // Cuadro horizontal simplificado: semifinal -> final <- semifinal (sin cuartos) en la 1ra Edición;
  // en Sábados 2da el Bronce son 8 equipos y usa el cuadro completo
  const BracketBronce = () => {
    if (torneo === 'sabados2') return <BracketCompleto prefijo="bronce" trofeoClase="trophy trophy-bronce" />
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
          {torneo !== 'domingos' && <tr><td colSpan={4} className="h-1.5"></td></tr>}
          {torneo !== 'domingos' && <tr>
            <td className="text-orange-400 font-bold text-left pr-0.5">🥉 Bronce</td>
            {torneo === 'sabados2' ? (
              <>
                <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">4tos<br />de Final</td>
                <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Semifinal</td>
                <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Final</td>
              </>
            ) : (
              <>
                <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Semifinal</td>
                <td className="text-gray-600 py-2 px-0.5">No juega</td>
                <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Final</td>
              </>
            )}
          </tr>}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-500 mt-2">Los perdedores de los 4tos de Oro pasan a jugar la Semifinal de Plata. {torneo === 'domingos' ? 'Los 8 equipos juegan los 4tos de la Copa de Oro.' : torneo === 'sabados2' ? 'Copa de Oro: del 1° al 8° de la Liga. Copa de Bronce: del 9° al 16°.' : 'Copa Bronce: los últimos 4 de la Liga.'}</p>
    </div>
  )

  // Una fila "equipo  goles - goles  equipo" para el ejemplo y el detalle de los cruces
  const FilaPartido = ({ etiqueta, local, golesLocal, golesVisitante, visitante, resaltado }) => (
    <div className={`grid grid-cols-[44px_1fr_auto_1fr] items-center gap-2 py-1 ${resaltado ? 'text-yellow-300' : 'text-gray-300'}`}>
      <span className="text-[9px] uppercase tracking-wider text-gray-500">{etiqueta}</span>
      <span className="text-right text-[11px] font-semibold truncate">{local}</span>
      <span className="text-sm font-black text-white tabular-nums px-1">{golesLocal == null ? 'vs' : `${golesLocal} - ${golesVisitante}`}</span>
      <span className="text-[11px] font-semibold truncate">{visitante}</span>
    </div>
  )

  const ExplicacionIdaVuelta = () => (
    <div className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/30 mb-4">
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Cuartos de final: ida y vuelta</p>
      <p className="text-xs text-gray-300 leading-relaxed mb-3">
        Cada cruce de cuartos se juega en <span className="font-bold text-white">2 partidos</span> (ida y vuelta, invirtiendo la localía).
        Pasa el equipo con mejor <span className="font-bold text-white">diferencia de gol</span> sumando los dos partidos.
        Si el global queda igual, se define por <span className="font-bold text-yellow-300">penales</span>.
        Las semifinales y las finales son a partido único.
      </p>
      <div className="rounded-lg bg-[#111] px-3 py-2 border border-white/5">
        <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Ejemplo</p>
        <FilaPartido etiqueta="Ida" local="Equipo A" golesLocal={2} golesVisitante={1} visitante="Equipo B" />
        <FilaPartido etiqueta="Vuelta" local="Equipo B" golesLocal={2} golesVisitante={1} visitante="Equipo A" />
        <div className="border-t border-white/10 mt-1 pt-1">
          <FilaPartido etiqueta="Global" local="Equipo A" golesLocal={3} golesVisitante={3} visitante="Equipo B" resaltado />
        </div>
        <p className="text-[10px] text-yellow-300 text-center font-bold mt-1">Empate en el global: se define por penales</p>
        <div className="mt-1">
          <FilaPartido etiqueta="Penales" local="Equipo A" golesLocal={4} golesVisitante={3} visitante="Equipo B" />
        </div>
        <p className="text-[10px] text-green-400 text-center font-bold">Pasa el Equipo A</p>
      </div>
    </div>
  )

  const EsquemaIdaVuelta = () => (
    <div className="bg-[#1a1a1a] rounded-xl p-3 border border-green-900/30 mb-4">
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Cómo se juegan las copas</p>
      <table className="w-full text-center border-collapse table-fixed">
        <thead>
          <tr>
            <th className="text-[9px] text-gray-600 font-semibold pb-1.5 w-[17%]"></th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 1</th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 2</th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 3</th>
            <th className="text-[9px] text-gray-400 font-bold uppercase pb-1.5">Fecha 4</th>
          </tr>
        </thead>
        <tbody className="text-[10px]">
          <tr>
            <td className="text-yellow-400 font-bold text-left pr-0.5">🥇 Oro</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">4tos<br />Ida</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">4tos<br />Vuelta</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">Semi</td>
            <td className="bg-yellow-900/20 rounded-lg py-2 px-0.5 text-white">Final</td>
          </tr>
          <tr><td colSpan={5} className="h-1.5"></td></tr>
          <tr>
            <td className="text-gray-300 font-bold text-left pr-0.5">🥈 Plata</td>
            <td className="text-gray-600 py-2 px-0.5">No juega</td>
            <td className="text-gray-600 py-2 px-0.5">No juega</td>
            <td className="bg-gray-500/10 rounded-lg py-2 px-0.5 text-white">Semi</td>
            <td className="bg-gray-500/10 rounded-lg py-2 px-0.5 text-white">Final</td>
          </tr>
          {torneo !== 'domingos' && <tr><td colSpan={5} className="h-1.5"></td></tr>}
          {torneo !== 'domingos' && (
            <tr>
              <td className="text-orange-400 font-bold text-left pr-0.5">🥉 Bronce</td>
              <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">4tos<br />Ida</td>
              <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">4tos<br />Vuelta</td>
              <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Semi</td>
              <td className="bg-orange-900/20 rounded-lg py-2 px-0.5 text-white">Final</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-500 mt-2">
        {torneo === 'domingos'
          ? 'Los 8 equipos juegan los 4tos de Oro. Los 4 que pierden pasan a las Semifinales de Plata.'
          : 'Oro: puestos 1° al 8°. Bronce: puestos 9° al 16°. Los 4 que pierden los 4tos de Oro pasan a las Semifinales de Plata.'}
      </p>
    </div>
  )

  // Detalle de cada cruce de cuartos: ida, vuelta, global y penales
  const DetalleCuartos = ({ copa }) => {
    const series = seriesDeCopa(partidos, copa)
    if (series.length === 0) return null
    return (
      <div className="mt-3 space-y-2">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Detalle de los cuartos</p>
        {series.map(s => {
          const r = resultadoSerie(s)
          const nA = getEq(r.A).nombre || '?', nB = getEq(r.B).nombre || '?'
          const fila = (p, etiqueta) => p
            ? <FilaPartido etiqueta={etiqueta} local={getEq(p.local).nombre || '?'} golesLocal={p.jugado ? p.golesLocal : null} golesVisitante={p.golesVisitante} visitante={getEq(p.visitante).nombre || '?'} />
            : null
          return (
            <div key={s.serie} className="bg-[#1a1a1a] rounded-xl px-3 py-2 border border-green-900/20">
              <p className="text-[10px] font-bold text-green-400 mb-0.5">Cruce {s.serie}</p>
              {fila(s.ida, 'Ida')}
              {fila(s.vuelta, 'Vuelta')}
              {s.ida?.jugado && (
                <div className="border-t border-white/10 mt-1 pt-1">
                  <FilaPartido etiqueta={r.completa ? "Global" : "Parcial"} local={nA} golesLocal={r.golesA} golesVisitante={r.golesB} visitante={nB} resaltado={r.aPenales} />
                  {r.aPenales && r.ganador && <FilaPartido etiqueta="Penales" local={nA} golesLocal={r.penalesA} golesVisitante={r.penalesB} visitante={nB} />}
                  {r.aPenales && r.faltanPenales && <p className="text-[10px] text-yellow-300 text-center font-bold">Empate en el global: se define por penales</p>}
                  {r.ganador && <p className="text-[10px] text-green-400 text-center font-bold">Pasa {getEq(r.ganador).nombre || '?'}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-green-900/40 to-[#0a0a0a] px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white mb-4">Copas</h1>
        {idaVuelta ? <EsquemaIdaVuelta /> : <EsquemaCopas />}
        {idaVuelta && <ExplicacionIdaVuelta />}
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3">
          <p className="text-xs text-yellow-200 leading-relaxed">
            <span className="font-bold">⚠️ Los cruces son al azar.</span> No se arman por posición en la tabla (1° vs último, 2° vs anteúltimo, etc.) — la app sortea los cruces entre los equipos que participan en cada copa ({torneo === 'domingos' ? 'Oro y Plata' : 'Oro, Plata y Bronce'}).
          </p>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        <div>
          <SeccionTitulo>🥇 Copa de Oro</SeccionTitulo>
          <BracketOro />
          {idaVuelta && <DetalleCuartos copa="oro" />}
        </div>

        <div>
          <SeccionTitulo>🥈 Copa de Plata</SeccionTitulo>
          <BracketPlata />
        </div>

        {torneo !== 'domingos' && (
          <div>
            <SeccionTitulo>🥉 Copa de Bronce</SeccionTitulo>
            <BracketBronce />
            {idaVuelta && <DetalleCuartos copa="bronce" />}
          </div>
        )}
      </div>
    </div>
  )
}
