import { cuartosIdaVuelta } from './copasSeries'

// Jornadas de la fase de copas, agrupadas para poder cargar resultados igual que una Fecha de Liga
// (compartido entre Admin y Home)
export const COPA_JORNADAS = {
  copa_1: ['oro_4tos', 'bronce_semi'],
  copa_2: ['oro_semi', 'plata_semi'],
  copa_3: ['oro_final', 'plata_final', 'bronce_final'],
}

// Sábados 2da Edición (16 equipos): Oro 1° al 8°, Bronce 9° al 16° y Plata con los 4 que pierden en cuartos de Oro.
// Los cuartos se juegan a IDA y VUELTA (fechas de copa 1 y 2); semifinales y finales son partido único.
export const COPA_JORNADAS_2DA = {
  copa_1: ['oro_4tos', 'bronce_4tos'],
  copa_2: ['oro_4tos_vuelta', 'bronce_4tos_vuelta'],
  copa_3: ['oro_semi', 'plata_semi', 'bronce_semi'],
  copa_4: ['oro_final', 'plata_final', 'bronce_final'],
}

// Domingos (8 equipos, solo Oro y Plata): los 8 juegan cuartos de Oro (ida y vuelta) y los 4 que pierden pasan a Plata
export const COPA_JORNADAS_DOMINGOS = {
  copa_1: ['oro_4tos'],
  copa_2: ['oro_4tos_vuelta'],
  copa_3: ['oro_semi', 'plata_semi'],
  copa_4: ['oro_final', 'plata_final'],
}

// Jornadas de copa según el torneo ('sabados2' o prefijo 'sabados2/')
export const jornadasCopa = torneo => {
  if (torneo === 'sabados2' || torneo === 'sabados2/') return COPA_JORNADAS_2DA
  if (torneo === 'domingos' || torneo === 'domingos/') return COPA_JORNADAS_DOMINGOS
  return COPA_JORNADAS
}

export const FASE_LABELS = {
  oro_4tos: 'Cuartos de Final',
  oro_4tos_vuelta: 'Cuartos de Final · Vuelta',
  oro_semi: 'Semifinal',
  oro_final: 'Final',
  plata_semi: 'Semifinal',
  plata_final: 'Final',
  bronce_4tos: 'Cuartos de Final',
  bronce_4tos_vuelta: 'Cuartos de Final · Vuelta',
  bronce_semi: 'Semifinal',
  bronce_final: 'Final',
}

// Nombre de una ronda según el torneo: en los torneos con ida y vuelta, los cuartos de ida dicen "· Ida"
export const faseLabel = (fase, torneo) => {
  if (cuartosIdaVuelta(torneo) && (fase === 'oro_4tos' || fase === 'bronce_4tos')) return 'Cuartos de Final · Ida'
  return FASE_LABELS[fase] || fase
}

export const COPA_LABELS = {
  oro: '🥇 Copa de Oro',
  plata: '🥈 Copa de Plata',
  bronce: '🥉 Copa de Bronce',
}
