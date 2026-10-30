/**
 * RegisterModal — Modal de registro de nuevo cliente (empresa B2B).
 *
 * Campos alineados con la tabla `cliente` del MER_v3:
 *   - razon_social, cuit, nombre_completo, cargo_responsable,
 *     email, telefono, password_hash.
 *
 * Al registrarse exitosamente el backend establece la sesión automáticamente.
 * El modal informa el éxito y llama a onSuccess() para que LoginPage redirija.
 *
 * Patrón visual: idéntico a ForgotPasswordModal (overlay + card + tokens CSS).
 */
import { type FormEvent, useState } from 'react'
import { Building2, X, UserCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

interface RegisterModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function RegisterModal({ onClose, onSuccess }: RegisterModalProps) {
  /* ─── Campos del formulario ─────────────────────────────────────── */
  const [razonSocial, setRazonSocial] = useState('')
  const [cuit, setCuit] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [cargoResponsable, setCargoResponsable] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [pass, setPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  /* ─── Estado de UI ──────────────────────────────────────────────── */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  /* ─── Helpers ───────────────────────────────────────────────────── */
  const clearError = () => setError('')

  /** Formatea el CUIT automáticamente al escribir: 00-00000000-0 */
  const handleCuitChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '-' + digits.slice(2)
    if (digits.length > 10) formatted = formatted.slice(0, 11) + '-' + digits.slice(10)
    setCuit(formatted)
    clearError()
  }

  /* ─── Submit ────────────────────────────────────────────────────── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (pass !== confirmPass) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (pass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/register', {
        razonSocial: razonSocial.trim(),
        cuit: cuit.trim(),
        nombreCompleto: nombreCompleto.trim(),
        cargoResponsable: cargoResponsable.trim() || undefined,
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        pass,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar el registro. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Crear cuenta de empresa"
    >
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-lg border border-hairline bg-canvas p-8 shadow-[rgba(0,55,112,0.08)_0_8px_24px,rgba(0,55,112,0.04)_0_2px_6px]"
        style={{ maxHeight: 'calc(100dvh - 4rem)' }}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1 text-ink-mute transition-colors hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ─── Formulario ─────────────────────────────────────────── */}
        {!success && (
          <>
            <div className="mb-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-ink">
                Crear cuenta de empresa
              </h2>
              <p className="mt-1.5 text-[14px] font-light text-ink-mute">
                Completá los datos de tu empresa para acceder al cotizador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Razón social */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-razon-social">Razón social *</Label>
                <Input
                  id="reg-razon-social"
                  type="text"
                  placeholder="Ej: Aluar S.A."
                  autoComplete="organization"
                  autoFocus
                  value={razonSocial}
                  onChange={(e) => { setRazonSocial(e.target.value); clearError() }}
                />
              </div>

              {/* CUIT */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-cuit">CUIT *</Label>
                <Input
                  id="reg-cuit"
                  type="text"
                  placeholder="00-00000000-0"
                  inputMode="numeric"
                  value={cuit}
                  onChange={(e) => handleCuitChange(e.target.value)}
                />
              </div>

              {/* Nombre responsable + cargo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nombre">Responsable *</Label>
                  <Input
                    id="reg-nombre"
                    type="text"
                    placeholder="Juan García"
                    autoComplete="name"
                    value={nombreCompleto}
                    onChange={(e) => { setNombreCompleto(e.target.value); clearError() }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-cargo">Cargo</Label>
                  <Input
                    id="reg-cargo"
                    type="text"
                    placeholder="Jefe de eventos"
                    value={cargoResponsable}
                    onChange={(e) => { setCargoResponsable(e.target.value) }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="eventos@empresa.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-telefono">Teléfono</Label>
                <Input
                  id="reg-telefono"
                  type="tel"
                  placeholder="+54 11 0000-0000"
                  autoComplete="tel"
                  value={telefono}
                  onChange={(e) => { setTelefono(e.target.value) }}
                />
              </div>

              {/* Contraseña + confirmación */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-pass">Contraseña *</Label>
                  <Input
                    id="reg-pass"
                    type="password"
                    placeholder="Mínimo 6 chars"
                    autoComplete="new-password"
                    value={pass}
                    onChange={(e) => { setPass(e.target.value); clearError() }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm-pass">Confirmar *</Label>
                  <Input
                    id="reg-confirm-pass"
                    type="password"
                    placeholder="Repetí la clave"
                    autoComplete="new-password"
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); clearError() }}
                  />
                </div>
              </div>

              {/* Error inline */}
              {error && (
                <p role="alert" className="text-sm text-state-danger">
                  {error}
                </p>
              )}

              {/* CTA */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full gap-2"
                disabled={
                  !razonSocial.trim() ||
                  !cuit.trim() ||
                  !nombreCompleto.trim() ||
                  !email.trim() ||
                  !pass ||
                  !confirmPass ||
                  loading
                }
              >
                <Building2 className="h-4 w-4" />
                {loading ? 'Registrando…' : 'Crear cuenta'}
              </Button>

              {/* Volver al login */}
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-[13px] text-ink-mute underline-offset-2 hover:text-ink hover:underline"
              >
                ← Volver al login
              </button>
            </form>
          </>
        )}

        {/* ─── Pantalla de éxito ───────────────────────────────────── */}
        {success && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-state-ok-bg">
              <UserCheck className="h-6 w-6 text-state-ok" />
            </div>
            <h2 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-ink">
              ¡Cuenta creada!
            </h2>
            <p className="mt-2 text-[14px] font-light text-ink-mute">
              Tu empresa fue registrada. Ahora podés iniciar sesión con tu email y contraseña.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              onClick={onSuccess}
            >
              Ir al login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
