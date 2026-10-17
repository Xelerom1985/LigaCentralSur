// Cuartos de final a IDA Y VUELTA (Sábados 2da y Domingos). Semifinales y finales son partido único.
//
// Cada cruce de cuartos es una "serie" de dos partidos con el mismo campo `serie`:
//   ida    -> fase 'oro_4tos'        (o 'bronce_4tos')         local = equipo A, visitante = equipo B
//   vuelta -> fase 'oro_4tos_vuelta' (o 'bronce_4tos_vuelta')  local = equipo B, visitante = equipo A
// Avanza el equipo con mejor diferencia de gol global (suma de los dos partidos).
// Si el global queda igual, se define por penales, que se cargan en el partido de VUELTA
// (penalesLocal = penales del local de la vuelta = equipo B, penalesVisitante = equipo A).

const TORNEOS_IDA_VUELTA = ['sabados2', 'domingos']

// torneo: 'sabados2' | 'domingos' | prefijo 'sabados2/' ...
export const cuartosIdaVuelta = torneo => TORNEOS_IDA_VUELTA.includes(String(torneo || '').replace('/', ''))

export const esFaseVuelta = fase => typeof fase === 'string' && fase.endsWith('_4tos_vuelta')
export const esFaseCuartosIda = fase => typeof fase === 'string' && fase.endsWith('_4tos')
export const copaDeFase = fase => String(fase || '').split('_')[0]   // 'oro' | 'plata' | 'bronce'

const porSerie = (a, b) => (a.serie ?? 99) - (b.serie ?? 99)

// Series de una copa ('oro' o 'bronce'): [{ serie, ida, vuelta }]
export function seriesDeCopa(partidos, copa) {
  const lista = Object.entries(partidos || {}).map(([id, p]) => ({ id, ...p }))
  const idas = lista.filter(p => p.fase === `${copa}_4tos`).sort(porSerie)
  const vueltas = lista.filter(p => p.fase === `${copa}_4tos_vuelta`)
  return idas.map((ida, i) => ({
    serie: ida.serie ?? i + 1,
    ida,
    vuelta: vueltas.find(v => v.serie != null && v.serie === ida.serie) || null,
  }))
}

// Serie a la que pertenece un partido (sea la ida o la vuelta)
export function seriePorPartido(partidos, p) {
  if (!p || !(esFaseCuartosIda(p.fase) || esFaseVuelta(p.fase))) return null
  const copa = copaDeFase(p.fase)
  return seriesDeCopa(partidos, copa).find(s => s.serie === p.serie) || null
}

const num = v => (v == null || v === '' ? null : Number(v))

// Resultado de una serie. golesA/golesB cuentan lo jugado hasta el momento.
export function resultadoSerie(serie) {
  const ida = serie?.ida || null
  const vuelta = serie?.vuelta || null
  const A = ida?.local ?? null
  const B = ida?.visitante ?? null
  let golesA = 0, golesB = 0
  if (ida?.jugado) { golesA += num(ida.golesLocal) || 0; golesB += num(ida.golesVisitante) || 0 }
  // en la vuelta el local es el equipo B y el visitante el equipo A
  if (vuelta?.jugado) { golesA += num(vuelta.golesVisitante) || 0; golesB += num(vuelta.golesLocal) || 0 }
  const completa = !!(ida?.jugado && vuelta?.jugado)
  const res = { A, B, golesA, golesB, completa, ganador: null, perdedor: null, aPenales: false, faltanPenales: false, penalesA: null, penalesB: null }
  if (!completa) return res
  if (golesA !== golesB) {
    res.ganador = golesA > golesB ? A : B
  } else {
    res.aPenales = true
    const pB = num(vuelta.penalesLocal), pA = num(vuelta.penalesVisitante)
    if (pA != null && pB != null && pA !== pB) {
      res.penalesA = pA; res.penalesB = pB
      res.ganador = pA > pB ? A : B
    } else {
      res.faltanPenales = true
    }
  }
  if (res.ganador) res.perdedor = res.ganador === A ? B : A
  return res
}

// Ganadores y perdedores de todos los cuartos de una copa, o un aviso si todavía no se puede
export function resultadoCuartos(partidos, copa) {
  const series = seriesDeCopa(partidos, copa)
  if (series.length === 0) return { error: 'Primero generá los cuartos de final' }
  if (series.some(s => !s.vuelta)) return { error: 'Falta el partido de vuelta de algún cruce de cuartos: regenerá los cuartos' }
  if (series.some(s => !(s.ida.jugado && s.vuelta.jugado))) return { error: 'Faltan jugar partidos (ida o vuelta) de los cuartos de final' }
  const ganadores = [], perdedores = []
  for (const s of series) {
    const r = resultadoSerie(s)
    if (r.faltanPenales) return { error: 'Hay un cruce empatado en el global: cargá los penales en el partido de vuelta antes de sortear' }
    ganadores.push(r.ganador)
    perdedores.push(r.perdedor)
  }
  return { ganadores, perdedores }
}

// Partidos a crear para unos cruces de cuartos: ida y vuelta (con la localía invertida)
export function partidosDeCuartos(cruces, fase) {
  const base = { numero: null, fechaHora: null, jugado: false, golesLocal: null, golesVisitante: null }
  const out = []
  cruces.forEach(({ local, visitante }, i) => {
    out.push({ ...base, fase, serie: i + 1, local, visitante })
    out.push({ ...base, fase: `${fase}_vuelta`, serie: i + 1, local: visitante, visitante: local })
  })
  return out
}

// Texto corto del global de una serie ya jugada: "Global A 3 - 3 B · Penales 4-3 · Pasa A" (null si falta jugar)
export function textoGlobal(res, nombreDe) {
  if (!res || !res.completa) return null
  let t = `Global ${nombreDe(res.A)} ${res.golesA} - ${res.golesB} ${nombreDe(res.B)}`
  if (res.aPenales) t += res.ganador ? ` · Penales ${res.penalesA}-${res.penalesB}` : ' · se define por penales'
  if (res.ganador) t += ` · Pasa ${nombreDe(res.ganador)}`
  return t
}

// Para mostrar en un partido de vuelta: global actual y penales, o null si no corresponde
export function resumenDeVuelta(partidos, p) {
  if (!p || !esFaseVuelta(p.fase)) return null
  const s = seriePorPartido(partidos, p)
  if (!s) return null
  return { serie: s, res: resultadoSerie(s) }
}
