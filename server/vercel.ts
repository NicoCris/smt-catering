/**
 * Entrypoint serverless para Vercel.
 * Se empaqueta con esbuild hacia api/index.js (ver script `build:api`).
 */
import { app } from './index.ts'

export default app
