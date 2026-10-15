import { z } from 'zod'

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'El usuario o email es requerido'),
  pass: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  fullName: z.string().min(2, 'El nombre completo es requerido'),
  phone: z.string().optional(),
  pass: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

