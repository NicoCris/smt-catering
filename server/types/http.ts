import type { UserRole } from '../../shared/types/roles'

export interface AuthenticatedUser {
  id: string
  username: string
  email: string
  role: UserRole
}

export interface Request {
  params: Record<string, string>
  query: Record<string, string | undefined>
  body: any
  cookies: Record<string, string | undefined>
  headers: Record<string, string | string[] | undefined>
  user?: AuthenticatedUser
}

export interface Response {
  status(code: number): Response
  json(data: any): void
  cookie(name: string, value: string, options?: any): Response
  clearCookie(name: string): Response
}

export type NextFunction = (err?: any) => void
export type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void | Promise<void>

export interface Router {
  get(path: string, ...handlers: RouteHandler[]): void
  post(path: string, ...handlers: RouteHandler[]): void
  put(path: string, ...handlers: RouteHandler[]): void
  delete(path: string, ...handlers: RouteHandler[]): void
}

export function createRouter(): Router {
  return {
    get: () => {},
    post: () => {},
    put: () => {},
    delete: () => {},
  }
}

