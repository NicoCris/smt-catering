import { createHmac, timingSafeEqual } from 'node:crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'smt-catering-super-secret-jwt-key-2026-prod'

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export interface JwtPayload {
  id: number
  role: 'superadmin' | 'admin' | 'cocina' | 'cliente'
  email: string
  fullName: string
  isClient: boolean
  exp?: number
}

export function signJwt(payload: Omit<JwtPayload, 'exp'>, expiresInSeconds = 7 * 24 * 60 * 60): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const fullPayload = { ...payload, exp }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const signature = createHmac('sha256', JWT_SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${dataToSign}.${signature}`
}

export function verifyJwt(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, signature] = parts
  if (!encodedHeader || !encodedPayload || !signature) return null

  const dataToSign = `${encodedHeader}.${encodedPayload}`
  const expectedSig = createHmac('sha256', JWT_SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSig)

  if (sigBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null

  try {
    const payloadStr = base64UrlDecode(encodedPayload)
    const payload = JSON.parse(payloadStr) as JwtPayload
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null // Token expirado
    }
    return payload
  } catch {
    return null
  }
}

