import { getDatabase } from '../../db/client'
import type { EventRecord } from '../../../shared/types/events'

export class EventsService {
  static async listEvents(): Promise<EventRecord[]> {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM events ORDER BY event_date ASC')
    const rows = stmt.all() as any[]

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      clientName: r.client_name,
      clientEmail: r.client_email,
      clientPhone: r.client_phone,
      eventDate: r.event_date,
      startTime: r.start_time,
      endTime: r.end_time,
      durationHours: r.duration_hours,
      locationAddress: r.location_address,
      distanceKm: r.distance_km,
      guests: r.guests,
      stationIds: [], // Cargar desde event_stations
      status: r.status,
      paymentStatus: r.payment_status,
      totalCents: r.total_cents,
      depositCents: r.deposit_cents,
      balanceCents: r.balance_cents,
      insuranceCents: r.insurance_cents,
      dietary: { celiacos: 0, vegetarianos: 0, veganos: 0, alergias: '' },
      kitchenNotes: r.kitchen_notes,
    }))
  }

  static async getMyEvents(userId: string): Promise<EventRecord[]> {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY event_date ASC')
    const rows = stmt.all(userId) as any[]
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      clientName: r.client_name,
      eventDate: r.event_date,
      startTime: r.start_time,
      endTime: r.end_time,
      durationHours: r.duration_hours,
      locationAddress: r.location_address,
      guests: r.guests,
      stationIds: [],
      status: r.status,
      paymentStatus: r.payment_status,
      totalCents: r.total_cents,
      depositCents: r.deposit_cents,
      balanceCents: r.balance_cents,
      insuranceCents: r.insurance_cents,
      dietary: { celiacos: 0, vegetarianos: 0, veganos: 0, alergias: '' },
    }))
  }
}

