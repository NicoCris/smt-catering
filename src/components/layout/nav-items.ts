import type { ComponentType } from 'react'
import { CalendarDays, ChefHat, Calculator, Percent } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Cotizador', icon: Calculator, end: true },
  { to: '/dashboard', label: 'Eventos', icon: CalendarDays },
  { to: '/comandas', label: 'Comandas', icon: ChefHat },
  { to: '/tarifas', label: 'Tarifas', icon: Percent },
]

export function useNavLinkClass(): (args: { isActive: boolean }) => string {
  return ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
      isActive ? 'bg-primary text-white' : 'text-ink-secondary hover:bg-canvas-soft',
    )
}
