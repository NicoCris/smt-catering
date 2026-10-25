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
 *  4. Enlace "¿Olvidaste tu contraseña?" abre ForgotPasswordModal (dos pasos).
 *  5. Enlace "¿No tenés cuenta?" abre RegisterModal para nuevos clientes B2B.
 */
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'

import { GradientMesh } from '@/components/layout/GradientMesh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { ForgotPasswordModal } from '@/features/login/ForgotPasswordModal'
import { RegisterModal } from '@/features/login/RegisterModal'

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)

  const [usernameInput, setUsernameInput] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  /* Si ya está autenticado, redirigir al cotizador */
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await login(usernameInput.trim(), pass)
    if (!ok) {
      setError(true)
    } else {
      // Si el rol es superadmin, redirige directamente al panel de AdminJS
      const loggedUser = useAuthStore.getState().user
      if (loggedUser?.role === 'superadmin') {
        window.location.href = '/admin'
      }
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
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value)
                setError(false)
              }}
            />
          </div>

          {/* Campo contraseña */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-pass">Contraseña</Label>
              {/* Enlace de recuperación — punto 3 de ISSUES.md §Login & Autenticación */}
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[12px] font-normal text-ink-mute underline-offset-2 transition-colors hover:text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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
              Usuario o contraseña incorrectos, o servidor no disponible.
            </p>
          )}

          {/* CTA — button-primary-pill (DESIGN.md §Buttons) */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full gap-2"
            disabled={!usernameInput.trim() || !pass}
          >
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </Button>
        </form>

        {/* Enlace de registro para nuevos clientes */}
        <p className="mt-6 text-center text-[13px] font-normal tracking-[-0.39px] text-ink-mute">
          ¿No tenés cuenta?{' '}
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="font-medium text-primary underline-offset-2 transition-colors hover:underline"
          >
            Registrate
          </button>
        </p>
      </div>

      {/* Modal de recuperación de contraseña */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {/* Modal de registro de nuevo cliente B2B */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => setShowRegister(false)}
        />
      )}
    </div>
  )
}
