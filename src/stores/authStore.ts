/**
 * Auth Store — Zustand store para gestión de autenticación.
 *
 * Gestiona el estado de sesión de la aplicación (login/logout).
 * Credenciales por defecto: usuario "admin", contraseña "admin".
 *
 * Persistencia: usa sessionStorage para mantener la sesión activa
 * mientras la pestaña esté abierta. Se borra al cerrar el navegador.
 *
 * Consumido por:
 *  - App.tsx → para decidir si renderizar rutas protegidas o redirigir a /login.
 *  - LoginPage.tsx → para ejecutar el login.
 *  - AppShell.tsx → para mostrar botón de logout.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Credenciales válidas (hardcoded para MVP sin backend). */
const VALID_USER = 'admin'
const VALID_PASS = 'admin'

interface AuthState {
  /** Indica si el usuario tiene una sesión activa */
  isAuthenticated: boolean
  /** Nombre de usuario autenticado (null si no hay sesión) */
  username: string | null
  /**
   * Intenta autenticar con usuario y contraseña.
   * @returns true si las credenciales son correctas, false en caso contrario.
   */
  login: (user: string, pass: string) => boolean
  /** Cierra la sesión y limpia el estado */
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,

      login: (user: string, pass: string): boolean => {
        if (user === VALID_USER && pass === VALID_PASS) {
          set({ isAuthenticated: true, username: user })
          return true
        }
        return false
      },

      logout: () => {
        set({ isAuthenticated: false, username: null })
      },
    }),
    {
      name: 'smt-auth',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
