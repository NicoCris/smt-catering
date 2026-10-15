import type { Request, Response } from '../../types/http'
import { EventsService } from './events.service'

export class EventsController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const events = await EventsService.listEvents()

      if (req.user?.role === 'cocina') {
        const sanitized = events.map((e) => ({
          id: e.id,
          clientName: e.clientName,
          eventDate: e.eventDate,
          startTime: e.startTime,
          endTime: e.endTime,
          durationHours: e.durationHours,
          locationAddress: e.locationAddress,
          guests: e.guests,
          status: e.status,
          kitchenNotes: e.kitchenNotes,
        }))
        res.json({ events: sanitized })
        return
      }

      res.json({ events })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al listar eventos' })
    }
  }

  static async myEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || ''
      const events = await EventsService.getMyEvents(userId)
      res.json({ events })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener eventos del cliente' })
    }
  }
}
