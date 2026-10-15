import type { Request, Response } from '../../types/http'
import { AuthService } from './auth.service'
import { loginSchema, registerSchema } from '../../../shared/schemas/auth.schema'

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const data = loginSchema.parse(req.body)
      const { user, token } = await AuthService.login(data)

      res.cookie('smt_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      res.json({ user })
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error en inicio de sesión' })
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const data = registerSchema.parse(req.body)
      const user = await AuthService.register(data)
      res.status(201).json({ user })
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al registrar usuario' })
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('smt_token')
    res.json({ message: 'Sesión finalizada correctamente' })
  }

  static async me(req: Request, res: Response): Promise<void> {
    res.json({ user: req.user })
  }
}
