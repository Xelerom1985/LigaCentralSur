import { calcTabla } from './components/Tabla'

// Premios por fecha de Liga: goleador (jugador con más goles) y valla menos vencida (equipo).
// - Los partidos marcados como walkover (sinCuota) no premian: no hubo partido real.
// - Goleador, empate: 1) gana el jugador cuyo equipo ganó, 2) mejor diferencia de gol del equipo en ese partido,
//   3) equipo mejor ubicado en la tabla (con los resultados hasta esa fecha).
// - Valla, empate: 1) más goles a favor en ese partido, 2) equipo mejor ubicado en la tabla.
export function calcPremiosPorFecha({ partidos, goles, jugadores, equipos }) {
  const porFecha = {}
  Object.entries(partidos || {}).forEach(([id, p]) => {
    if (p.fase !== 'liga' || p.numero == null) return
    const n = Number(p.numero)
    if (!porFecha[n]) porFecha[n] = []
    porFecha[n].push({ id, ...p })
  })

  const resultado = []
  const numeros = Object.keys(porFecha).map(Number).sort((a, b) => a - b)

  for (const n of numeros) {
    const reales = porFecha[n].filter(p => !p.libre && p.local && p.visitante)
    const jugados = reales.filter(p => p.jugado && p.golesLocal != null && p.golesVisitante != null)
    if (jugados.length === 0) continue
    const completa = reales.every(p => p.jugado || p.suspendido)
    const elegibles = jugados.filter(p => !p.sinCuota)

    // Tabla con los resultados hasta esta fecha (para desempatar con la posición de ese momento)
    const hastaAqui = Object.fromEntries(
      Object.entries(partidos).filter(([, p]) => p.fase === 'liga' && p.numero != null && Number(p.numero) <= n)
    )
    const pos = {}
    calcTabla(hastaAqui, equipos || {}).forEach((e, i) => { pos[e.id] = i })
    const posDe = id => pos[id] ?? 999

    // Registro de cada equipo en su partido de la fecha
    const reg = {}
    elegibles.forEach(p => {
      const gl = Number(p.golesLocal), gv = Number(p.golesVisitante)
      reg[p.local] = { equipoId: p.local, gf: gl, gc: gv, gano: gl > gv, dif: gl - gv }
      reg[p.visitante] = { equipoId: p.visitante, gf: gv, gc: gl, gano: gv > gl, dif: gv - gl }
    })

    // ---- Valla ----
    let valla = null
    const equiposFecha = Object.values(reg)
    if (equiposFecha.length > 0) {
      const orden = [...equiposFecha].sort((a, b) =>
        a.gc - b.gc || b.gf - a.gf || posDe(a.equipoId) - posDe(b.equipoId))
      const [ganador, segundo] = orden
      let desempate = null
      if (segundo && segundo.gc === ganador.gc) desempate = segundo.gf !== ganador.gf ? 'goles a favor' : 'posición en la tabla'
      valla = {
        equipoId: ganador.equipoId,
        nombre: equipos?.[ganador.equipoId]?.nombre || '?',
        escudo: equipos?.[ganador.equipoId]?.escudo || null,
        gc: ganador.gc, gf: ganador.gf, desempate,
      }
    }

    // ---- Goleador ----
    const cuenta = {}
    elegibles.forEach(p => {
      Object.values(goles?.[p.id] || {}).forEach(g => {
        if (g.enContra || !g.jugadorId || !g.equipoId) return
        const key = `${g.equipoId}___${g.jugadorId}`
        cuenta[key] = (cuenta[key] || 0) + 1
      })
    })
    const candidatos = Object.entries(cuenta)
      .filter(([key]) => reg[key.split('___')[0]])
      .map(([key, total]) => {
        const [equipoId, jugadorId] = key.split('___')
        const r = reg[equipoId]
        const j = jugadores?.[equipoId]?.[jugadorId] || {}
        return {
          equipoId, jugadorId, total, gano: r.gano, dif: r.dif, pos: posDe(equipoId),
          nombre: j.nombre || 'Jugador', numero: j.numero || '',
          equipo: equipos?.[equipoId]?.nombre || '', escudo: equipos?.[equipoId]?.escudo || null,
        }
      })
      .sort((a, b) => b.total - a.total || Number(b.gano) - Number(a.gano) || b.dif - a.dif || a.pos - b.pos)

    let goleador = null
    if (candidatos.length > 0) {
      const primero = candidatos[0]
      const igual = c => c.total === primero.total && c.gano === primero.gano && c.dif === primero.dif && c.pos === primero.pos
      const ganadores = candidatos.filter(igual)
      const otro = candidatos.find(c => !igual(c))
      let desempate = null
      if (ganadores.length > 1) desempate = 'empate total (mismo equipo)'
      else if (candidatos.length > 1 && candidatos[1].total === primero.total) {
        const s = candidatos[1]
        desempate = s.gano !== primero.gano ? 'resultado del equipo'
          : s.dif !== primero.dif ? 'diferencia de gol del equipo' : 'posición en la tabla'
      }
      goleador = { ganadores, desempate, tieneOtro: !!otro }
    }

    resultado.push({ fecha: n, completa, goleador, valla })
  }
  return resultado
}
