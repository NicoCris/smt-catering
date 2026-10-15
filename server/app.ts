/**
 * Ensamblador principal de la API del servidor.
 * Conecta cada módulo vertical aislado bajo su prefijo de ruta /api/*.
 */
import { authRouter } from './modules/auth/auth.routes'
import { eventsRouter } from './modules/events/events.routes'
import { quotationRouter } from './modules/quotation/quotation.routes'
import { productionRouter } from './modules/production/production.routes'
import { tariffsRouter } from './modules/tariffs/tariffs.routes'

export interface AppModules {
  auth: typeof authRouter
  events: typeof eventsRouter
  quotation: typeof quotationRouter
  production: typeof productionRouter
  tariffs: typeof tariffsRouter
}

export const appModules: AppModules = {
  auth: authRouter,
  events: eventsRouter,
  quotation: quotationRouter,
  production: productionRouter,
  tariffs: tariffsRouter,
}

