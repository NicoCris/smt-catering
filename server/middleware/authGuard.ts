import type { Request, Response, NextFunction } from '../types/http'

/**
 * Middleware de verificación de autenticación.
 * Lee el token JWT desde la cookie HTTP-only (o header Authorization).
 */
export function authGuard(req: Request, res: Response, next?: NextFunction): void {
  const token = req.cookies?.['smt_token'] || (typeof req.headers.authorization === 'string' ? req.headers.authorization.replace('Bearer ', '') : undefined)

  if (!token) {
    res.status(401).json({ error: 'No autenticado. Inicie sesión para continuar.' })
    return
  }

  // TODO: Validar token JWT y setear req.user
  if (next) next()
}
