import type { UserRole } from './roles'

export interface User {
  id: string
  email: string
  username: string
  fullName: string
  phone?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  user: User
  token: string
}

export interface LoginPayload {
  usernameOrEmail: string
  pass: string
}

export interface RegisterPayload {
  email: string
  username: string
  fullName: string
  phone?: string
  pass: string
}

