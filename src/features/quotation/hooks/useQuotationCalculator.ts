import { useMemo } from 'react'

import { DEPOSIT_PERCENT } from '@/lib/constants'
import { useTariffStore } from '@/stores/tariffStore'
import { useQuotationStore } from '@/stores/quotationStore'

/**
 * Motor de cálculo financiero inmediato del Cotizador (AGENTS.md §Módulo 1).
 *
 * Invariantes de Negocio:
 * - Todos los importes monetarios se calculan en CENTAVOS ENTEROS (ARS) para eliminar errores de redondeo de punto flotante.
 * - Estructura de cobro de SMT Catering:
 *   - Seña = 40% del total (`DEPOSIT_PERCENT = 40`).
 *   - Saldo = 60% restante (`BALANCE_PERCENT = 60`).
 * - Validaciones en caliente:
 *   - `dietExceedsGuests`: Verifica que la suma de comensales con dietas no supere el total del evento.
 *   - `hasStations`: Valida que exista al menos una estación culinaria para emitir propuesta.
 */
export interface QuotationTotals {
  perGuestCents: number
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

    const base = tariffs.find((t) => t.category === 'base')?.pricePerGuestCents ?? 0
    const stationsCents = stationIds.reduce((sum, id) => sum + priceOf(id), 0)
    const extrasCents = extraIds.reduce((sum, id) => sum + priceOf(id), 0)

    const perGuestCents = base + stationsCents + extrasCents
    const totalCents = perGuestCents * guests
    const depositCents = Math.round((totalCents * DEPOSIT_PERCENT) / 100)

    const dietTotal = dietary.celiacos + dietary.vegetarianos + dietary.veganos

    return {
      perGuestCents,
      totalCents,
      depositCents,
      balanceCents: totalCents - depositCents,
      dietTotal,
      dietExceedsGuests: dietTotal > guests,
      hasStations: stationIds.length > 0,
    }
  }, [guests, stationIds, extraIds, dietary, tariffs])
}
