import { createRouter } from '../../types/http'
import { EventsController } from './events.controller'
import { authGuard } from '../../middleware/authGuard'
import { requireRoles } from '../../middleware/roleGuard'

export const eventsRouter = createRouter()

eventsRouter.get('/', authGuard, requireRoles(['admin', 'superadmin', 'cocina']), EventsController.list)
eventsRouter.get('/my-events', authGuard, requireRoles(['cliente']), EventsController.myEvents)
