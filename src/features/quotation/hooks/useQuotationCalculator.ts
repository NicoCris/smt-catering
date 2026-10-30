import { useMemo } from 'react'

import { DEPOSIT_PERCENT } from '@/lib/constants'
import { useTariffStore } from '@/stores/tariffStore'
import { useQuotationStore } from '@/stores/quotationStore'

/**
 * Motor de cálculo financiero inmediato del Cotizador (AGENTS.md §Módulo 1).
 *
 * Invariantes de Negocio:
 * - Todos los importes monetarios se calculan en CENTAVOS ENTEROS (ARS).
 * - Total = (estaciones + extras) por comensal × comensales + Seguro.
 * - El Seguro es un monto FIJO por evento: no depende de la cantidad de comensales.
 * - Seña = `DEPOSIT_PERCENT` % del total (incluye el Seguro). Saldo = lo que resta del total.
 */
export interface QuotationTotals {
  perGuestCents: number
  /** Subtotal por comensales (sin Seguro). */
  subtotalCents: number
  /** Seguro: monto fijo por evento. */
  insuranceCents: number
  totalCents: number
  depositCents: number
  balanceCents: number
  dietTotal: number
  dietExceedsGuests: boolean
  hasStations: boolean
}

export function useQuotationCalculator(): QuotationTotals {
  const guests = useQuotationStore((s) => s.guests)
  const stationIds = useQuotationStore((s) => s.stationIds)
  const extraIds = useQuotationStore((s) => s.extraIds)
  const dietary = useQuotationStore((s) => s.dietary)
  const tariffs = useTariffStore((s) => s.tariffs)

  return useMemo(() => {
    const priceOf = (id: string): number =>
      tariffs.find((t) => t.id === id)?.pricePerGuestCents ?? 0

    const stationsCents = stationIds.reduce((sum, id) => sum + priceOf(id), 0)
    const extrasCents = extraIds.reduce((sum, id) => sum + priceOf(id), 0)
    const insuranceCents = tariffs.find((t) => t.category === 'insurance')?.fixedCents ?? 0

    const perGuestCents = stationsCents + extrasCents
    const subtotalCents = perGuestCents * guests
    const totalCents = subtotalCents + insuranceCents
    const depositCents = Math.round((totalCents * DEPOSIT_PERCENT) / 100)

    const dietTotal = dietary.celiacos + dietary.vegetarianos + dietary.veganos

    return {
      perGuestCents,
      subtotalCents,
      insuranceCents,
      totalCents,
      depositCents,
      balanceCents: totalCents - depositCents,
      dietTotal,
      dietExceedsGuests: dietTotal > guests,
      hasStations: stationIds.length > 0,
    }
  }, [guests, stationIds, extraIds, dietary, tariffs])
}