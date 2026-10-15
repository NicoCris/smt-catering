import type { Request, Response } from '../../types/http'
import { QuotationService } from './quotation.service'
import { quotationFormSchema } from '../../../shared/schemas/quotation.schema'

export class QuotationController {
  static async checkDate(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date as string
      if (!date) {
        res.status(400).json({ error: 'La fecha es requerida' })
        return
      }
      const availability = await QuotationService.checkAvailability(date)
      res.json(availability)
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al verificar disponibilidad' })
    }
  }

  static async calculate(req: Request, res: Response): Promise<void> {
    try {
      const data = quotationFormSchema.parse(req.body)
      const quote = await QuotationService.calculateQuotation(data)
      res.json(quote)
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error en cálculo de cotización' })
    }
  }
}
