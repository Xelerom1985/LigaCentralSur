// Jornadas de la fase de copas, agrupadas para poder cargar resultados igual que una Fecha de Liga
// (compartido entre Admin y Home)
export const COPA_JORNADAS = {
  copa_1: ['oro_4tos', 'bronce_semi'],
  copa_2: ['oro_semi', 'plata_semi'],
  copa_3: ['oro_final', 'plata_final', 'bronce_final'],
}

// Sábados 2da Edición (14 equipos): el Bronce son 6 equipos → cuartos (9° y 10° pasan directo), semifinal y final
export const COPA_JORNADAS_2DA = {
  copa_1: ['oro_4tos', 'bronce_4tos'],
  copa_2: ['oro_semi', 'plata_semi', 'bronce_semi'],
  copa_3: ['oro_final', 'plata_final', 'bronce_final'],
}

// Jornadas de copa según el torneo ('sabados2' o prefijo 'sabados2/')
export const jornadasCopa = torneo => (torneo === 'sabados2' || torneo === 'sabados2/') ? COPA_JORNADAS_2DA : COPA_JORNADAS

export const FASE_LABELS = {
  oro_4tos: 'Cuartos de Final',
  oro_semi: 'Semifinal',
  oro_final: 'Final',
  plata_semi: 'Semifinal',
  plata_final: 'Final',
  bronce_4tos: 'Cuartos de Final',
  bronce_semi: 'Semifinal',
  bronce_final: 'Final',
}

export const COPA_LABELS = {
  oro: '🥇 Copa de Oro',
  plata: '🥈 Copa de Plata',
  bronce: '🥉 Copa de Bronce',
}
