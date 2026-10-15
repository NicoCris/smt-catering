import { getDatabase } from '../../db/client'
import type { LoginInput, RegisterInput } from '../../../shared/schemas/auth.schema'
import type { User } from '../../../shared/types/auth'

export class AuthService {
  static async login(input: LoginInput): Promise<{ user: User; token: string }> {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    const userRow = stmt.get(input.usernameOrEmail, input.usernameOrEmail) as any

    if (!userRow) {
      throw new Error('Credenciales inválidas')
    }

    // TODO: Comparar con bcrypt.compare(input.pass, userRow.password_hash)

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      username: userRow.username,
      fullName: userRow.full_name,
      phone: userRow.phone,
      role: userRow.role_id,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    }

    const token = 'mock-jwt-token-' + user.id

    return { user, token }
  }

  static async register(input: RegisterInput): Promise<User> {
    const db = getDatabase()
    const id = 'usr-' + Date.now()
    // TODO: Hashear con bcrypt.hash(input.pass, 10)
    const hash = 'hashed-' + input.pass

    const stmt = db.prepare(
      'INSERT INTO users (id, email, username, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    stmt.run(id, input.email, input.username, hash, input.fullName, input.phone || null, 'cliente')

    return {
      id,
      email: input.email,
      username: input.username,
      fullName: input.fullName,
      phone: input.phone,
      role: 'cliente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

