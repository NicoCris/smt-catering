import { getDatabase } from '../../db/client'
import type { QuotationFormInput } from '../../../shared/schemas/quotation.schema'

export class QuotationService {
  static async checkAvailability(date: string): Promise<{ available: boolean; isConcurrent: boolean }> {
    const db = getDatabase()
    const stmt = db.prepare(
      "SELECT count(*) as count, sum(guests) as total_guests FROM events WHERE event_date = ? AND status != 'Cancelado'",
    )
    const result = stmt.get(date) as any

    const count = result?.count || 0
    const totalGuests = result?.total_guests || 0

    if (count === 0) {
      return { available: true, isConcurrent: false }
    }

    // Regla de concurrencia: si hay 1 evento con <= 60 comensales, se permite otro de max 60
    if (count === 1 && totalGuests <= 60) {
      return { available: true, isConcurrent: true }
    }

    return { available: false, isConcurrent: false }
  }

  static async calculateQuotation(input: QuotationFormInput) {
    const db = getDatabase()
    const tariffs = db.prepare('SELECT * FROM tariffs WHERE is_active = 1').all() as any[]
    const stations = db.prepare('SELECT * FROM stations').all() as any[]

    const baseTariff = tariffs.find((t) => t.category === 'base')?.price_per_guest_cents || 0
    const insuranceCents = tariffs.find((t) => t.category === 'insurance')?.fixed_cents || 0

    let stationsCentsPerGuest = 0
    for (const stationId of input.stationIds) {
      const station = stations.find((s) => s.id === stationId)
      if (station) {
        stationsCentsPerGuest += station.price_per_guest_cents
      }
    }

    const perGuestCents = baseTariff + stationsCentsPerGuest
    const subtotalCents = perGuestCents * input.guests
    const totalCents = subtotalCents + insuranceCents
    const depositCents = Math.round((totalCents * 50) / 100) // Seña 50%
    const balanceCents = totalCents - depositCents

    return {
      perGuestCents,
      subtotalCents,
      insuranceCents,
      totalCents,
      depositCents,
      balanceCents,
    }
  }
}

