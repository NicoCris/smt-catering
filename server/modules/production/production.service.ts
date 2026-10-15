import { getDatabase } from '../../db/client'

export interface ComandaTicket {
  ticketNumber: string
  eventId: string
  clientName: string
  eventDate: string
  startTime: string
  endTime: string
  durationHours: number
  locationAddress: string
  guests: number
  isConcurrent: boolean
  stations: Array<{ id: string; name: string }>
  dietary: {
    celiacos: number
    vegetarianos: number
    veganos: number
    alergias: string
    otrosDetalle?: string
    otrosCantidad?: number
  }
  kitchenNotes?: string
}

export class ProductionService {
  static async getComanda(eventId: string): Promise<ComandaTicket | null> {
    const db = getDatabase()
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any
    if (!event) return null

    // Verificar si es concurrente
    const sameDateCount = db
      .prepare("SELECT count(*) as c FROM events WHERE event_date = ? AND status != 'Cancelado'")
      .get(event.event_date) as any

    const isConcurrent = (sameDateCount?.c || 0) > 1

    // Estaciones
    const stations = db
      .prepare(
        'SELECT s.id, s.name FROM stations s JOIN event_stations es ON es.station_id = s.id WHERE es.event_id = ?',
      )
      .all(eventId) as any[]

    // Restricciones
    const dietary = db.prepare('SELECT * FROM event_dietary WHERE event_id = ?').get(eventId) as any

    return {
      ticketNumber: `CMD-${event.id}`,
      eventId: event.id,
      clientName: event.client_name,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      durationHours: event.duration_hours,
      locationAddress: event.location_address,
      guests: event.guests,
      isConcurrent,
      stations: stations.map((s) => ({ id: s.id, name: s.name })),
      dietary: {
        celiacos: dietary?.celiacos || 0,
        vegetarianos: dietary?.vegetarianos || 0,
        veganos: dietary?.veganos || 0,
        alergias: dietary?.alergias || '',
        otrosDetalle: dietary?.otros_detalle || undefined,
        otrosCantidad: dietary?.otros_cantidad || 0,
      },
      kitchenNotes: event.kitchen_notes,
    }
  }
}

