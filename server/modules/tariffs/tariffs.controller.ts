import type { Request, Response } from '../../types/http'
import { TariffsService } from './tariffs.service'

export class TariffsController {
  static async list(_req: Request, res: Response): Promise<void> {
    try {
      const tariffs = await TariffsService.listTariffs()
      res.json({ tariffs })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al listar tarifas' })
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { pricePerGuestCents, fixedCents } = req.body
      if (!id) {
        res.status(400).json({ error: 'ID de tarifa requerido' })
        return
      }
      await TariffsService.updateTariff(id, pricePerGuestCents, fixedCents)
      res.json({ message: 'Tarifa actualizada correctamente' })
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al actualizar tarifa' })
    }
  }
}
