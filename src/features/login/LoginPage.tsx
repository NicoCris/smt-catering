/**
 * LoginPage — Página de inicio de sesión de SMT Catering.
 *
 * Pantalla completa que presenta un
 * card centrado con los campos de usuario y contraseña.
 *
 * Credenciales por defecto: admin / admin (gestionadas por authStore).
 *
 * Flujo:
 *  1. Usuario ingresa credenciales → submit del form.
 *  2. authStore.login() valida → si es correcto, navega a "/" (cotizador).
 *  3. Si falla, muestra mensaje de error inline (sin modal).
 */
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'

import { GradientMesh } from '@/components/layout/GradientMesh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)

  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  /* Si ya está autenticado, redirigir al cotizador */
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const ok = login(user.trim(), pass)
    if (!ok) {
      setError(true)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-4">
      {/* Gradient Mesh atmosférico a pantalla completa (firma de marca) */}
      <GradientMesh />

      {/* Card de login — Level 2 shadow, rounded-lg 12px (DESIGN.md §Cards) */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-hairline bg-canvas p-8 shadow-[rgba(0,55,112,0.08)_0_8px_24px,rgba(0,55,112,0.04)_0_2px_6px]">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-ink">
            SMT Catering
          </h1>
          <p className="mt-2 text-[15px] font-light text-ink-mute">
            Iniciá sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo usuario */}
          <div className="space-y-1.5">
            <Label htmlFor="login-user">Usuario</Label>
            <Input
              id="login-user"
              type="text"
              placeholder="Ingresá tu usuario"
              autoComplete="username"
              autoFocus
              value={user}
              onChange={(e) => {
                setUser(e.target.value)
                setError(false)
              }}
            />
          </div>

          {/* Campo contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="login-pass">Contraseña</Label>
            <Input
              id="login-pass"
              type="password"
              placeholder="Ingresá tu contraseña"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value)
                setError(false)
              }}
            />
          </div>

          {/* Mensaje de error (inline, sin modal) */}
          {error && (
            <p role="alert" className="text-sm text-state-danger">
              Usuario o contraseña incorrectos
            </p>
          )}

          {/* CTA — button-primary-pill (DESIGN.md §Buttons) */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full gap-2"
            disabled={!user.trim() || !pass}
          >
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Button>
        </form>

        {/* Pie de card */}
        <p className="mt-6 text-center text-[13px] font-normal tracking-[-0.39px] text-ink-mute">
          Plataforma de gestión B2B
        </p>
      </div>
    </div>
  )
}
