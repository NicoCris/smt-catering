import type { IncomingMessage, ServerResponse } from 'node:http'
import { app } from '../server/index.ts'

/**
 * Entrypoint de Vercel Serverless Function (Fluid Compute).
 * Redirige todas las peticiones /api/* hacia la lógica de Node.js de SMT Catering.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res)
}
