import { createRouter } from '../../types/http'
import { ProductionController } from './production.controller'
import { authGuard } from '../../middleware/authGuard'
import { requireRoles } from '../../middleware/roleGuard'

export const productionRouter = createRouter()

productionRouter.get(
  '/:eventId',
  authGuard,
  requireRoles(['cocina', 'admin', 'superadmin']),
  ProductionController.getComanda,
)
