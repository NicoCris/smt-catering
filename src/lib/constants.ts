/** Reglas de negocio invariantes (AGENTS.md). No cambiar sin confirmación de negocio. */

export const GUEST_MIN = 50
export const GUEST_MAX = 120

/** Seña 40% / Saldo 60%. */
export const DEPOSIT_PERCENT = 40
export const BALANCE_PERCENT = 60

/** Comandas se generan con 30 días de anticipación. */
export const PRODUCTION_WINDOW_DAYS = 30

/** Antelación mínima requerida para reservar un evento (30 días). */
export const MIN_BOOKING_DAYS_ADVANCE = 30

/** Aviso de saldo pendiente 7 días antes del evento. */
export const BALANCE_NOTICE_DAYS = 7

export const STATIONS = [
  { id: 'entradas', name: 'Entradas' },
  { id: 'pastas', name: 'Pastas' },
  { id: 'parrilla', name: 'Parrilla' },
  { id: 'asiatica', name: 'Cocina Asiática' },
  { id: 'dulce', name: 'Estación Dulce' },
] as const

export type StationId = (typeof STATIONS)[number]['id']
