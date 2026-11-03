import type { IncomingMessage, ServerResponse } from 'node:http'
import { app } from '../server/index.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res)
}
