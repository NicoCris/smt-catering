/**
 * Definición central de roles de usuario del sistema (RBAC).
 * Fuente de verdad compartida entre Frontend y Backend.
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  COCINA: 'cocina',
  CLIENTE: 'cliente',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

