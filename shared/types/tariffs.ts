export type TariffCategory = 'base' | 'station' | 'extra' | 'insurance'

export interface Tariff {
  id: string
  label: string
  category: TariffCategory
  pricePerGuestCents: number
  fixedCents?: number // Para items de costo fijo como seguro si aplica
}

export interface TariffChange {
  id: string
  appliedAt: string
  percent: number
  tariffCount: number
  type?: 'bulk' | 'individual'
  tariffLabel?: string
  previousPriceCents?: number
  newPriceCents?: number
}

