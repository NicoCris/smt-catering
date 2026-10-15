import { getDatabase } from '../../db/client'
import type { Tariff } from '../../../shared/types/tariffs'

export class TariffsService {
  static async listTariffs(): Promise<Tariff[]> {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM tariffs WHERE is_active = 1').all() as any[]
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      category: r.category,
      pricePerGuestCents: r.price_per_guest_cents,
      fixedCents: r.fixed_cents,
    }))
  }

  static async updateTariff(id: string, pricePerGuestCents: number, fixedCents = 0): Promise<void> {
    const db = getDatabase()
    const stmt = db.prepare(
      'UPDATE tariffs SET price_per_guest_cents = ?, fixed_cents = ? WHERE id = ?',
    )
    stmt.run(pricePerGuestCents, fixedCents, id)
  }
}

