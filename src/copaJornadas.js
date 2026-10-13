// Jornadas de la fase de copas, agrupadas para poder cargar resultados igual que una Fecha de Liga
// (compartido entre Admin y Home)
export const COPA_JORNADAS = {
  copa_1: ['oro_4tos', 'bronce_semi'],
  copa_2: ['oro_semi', 'plata_semi'],
  copa_3: ['oro_final', 'plata_final', 'bronce_final'],
}

// Sábados 2da Edición (16 equipos): Oro 1° al 8°, Bronce 9° al 16° (ambos cuartos, semifinal y final) y Plata con los 4 que pierden en cuartos de Oro
export const COPA_JORNADAS_2DA = {
  copa_1: ['oro_4tos', 'bronce_4tos'],
  copa_2: ['oro_semi', 'plata_semi', 'bronce_semi'],
  copa_3: ['oro_final', 'plata_final', 'bronce_final'],
}

// Domingos (8 equipos, solo Oro y Plata): los 8 juegan cuartos de Oro y los 4 que pierden pasan a Plata
export const COPA_JORNADAS_DOMINGOS = {
  copa_1: ['oro_4tos'],
  copa_2: ['oro_semi', 'plata_semi'],
  copa_3: ['oro_final', 'plata_final'],
}

// Jornadas de copa según el torneo ('sabados2' o prefijo 'sabados2/')
export const jornadasCopa = torneo => {
  if (torneo === 'sabados2' || torneo === 'sabados2/') return COPA_JORNADAS_2DA
  if (torneo === 'domingos' || torneo === 'domingos/') return COPA_JORNADAS_DOMINGOS
  return COPA_JORNADAS
}

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
