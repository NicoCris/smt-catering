import type { Request, Response } from '../../types/http'
import { ProductionService } from './production.service'

export class ProductionController {
  static async getComanda(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId
      if (!eventId) {
        res.status(400).json({ error: 'ID de evento requerido' })
        return
      }
      const ticket = await ProductionService.getComanda(eventId)
      if (!ticket) {
        res.status(404).json({ error: 'Comanda no encontrada' })
        return
      }
      res.json({ comanda: ticket })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener comanda' })
    }
  }
}
