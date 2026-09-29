import type { StationId } from '@/lib/constants'

/** Estado de negocio del evento (no confundir con PaymentStatus). */
export type EventStatus =
  | 'Presupuestado'
  | 'Señado / Confirmado'
  | 'En Producción'
  | 'Completado'
  | 'Cancelado'

/** Estado de cobro (enum separado del estado del evento). */
export type PaymentStatus =
  | 'SEÑA_PENDIENTE'
  | 'SEÑA_ABONADA'
  | 'SALDO_PENDIENTE'
  | 'TOTALMENTE_SALDADO'

/** Restricciones alimentarias. La suma de dietas nunca puede superar los comensales. */
export interface DietaryRequirement {
  celiacos: number
  vegetarianos: number
  veganos: number
  /** Descripción libre de alergias (ej. "frutos secos, mariscos"). */
  alergias: string
}

export interface Station {
  id: StationId
  name: string
  /** Precio por comensal en centavos. */
  pricePerGuestCents: number
  description: string
}

export interface EventRecord {
  id: string
  clientName: string
  eventDate: string // ISO yyyy-mm-dd
  guests: number
  stationIds: StationId[]
  status: EventStatus
  paymentStatus: PaymentStatus
  /** Total congelado al momento de la reserva (centavos). */
  totalCents: number
  depositCents: number
  dietary: DietaryRequirement
  /** Productos/observaciones críticas para cocina (sin precios). */
  kitchenNotes: string
}

export type TariffCategory = 'base' | 'station' | 'extra'

export interface Tariff {
  id: string
  label: string
  category: TariffCategory
  /** Precio por comensal en centavos. */
  pricePerGuestCents: number
}

export interface TariffChange {
  id: string
  appliedAt: string // ISO timestamp
  percent: number
  tariffCount: number
  type?: 'bulk' | 'individual'
  tariffLabel?: string
  previousPriceCents?: number
  newPriceCents?: number
}
