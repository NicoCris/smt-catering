import { CalendarDays, CircleDollarSign, PiggyBank, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { EventsSummary } from '@/features/dashboard/hooks/useEventsSummary'

interface KpiDef {
  key: keyof EventsSummary
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const kpis: KpiDef[] = [
  { key: 'eventsThisMonth', label: 'Eventos del mes', icon: CalendarDays },
  { key: 'billingTotalCents', label: 'Facturación total', icon: TrendingUp },
  { key: 'depositsCollectedCents', label: 'Señas cobradas', icon: PiggyBank },
  { key: 'balancesPendingCents', label: 'Saldos por cobrar', icon: CircleDollarSign },
]

function formatKpi(key: keyof EventsSummary, value: number): string {
  return key === 'eventsThisMonth' ? String(value) : formatCurrency(value)
}

/**
 * Cuadrícula de Indicadores Clave de Desempeño (KPIs) del Dashboard (Módulo 2).
 *
 * Métricas calculadas:
 * 1. Eventos del mes: Conteo de eventos fechados en el mes en curso.
 * 2. Facturación total: Suma de importes totales (`totalCents`) contratados.
 * 3. Señas cobradas: Suma de señas acreditadas (40% de señados + 100% de saldados).
 * 4. Saldos por cobrar: Monto remanente (60%) de eventos pendientes de liquidación.
 *
 * Diseño: Grid responsivo de 4 columnas en desktop (>1280px), 2 en tablet y 1 en móvil.
 */
export function KpiGrid({ summary }: { summary: EventsSummary }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardHeader className="flex-row items-center gap-2 p-4 pb-1">
            <Icon className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-normal uppercase tracking-tight text-ink-mute">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-display-md font-light text-ink tnum">
              {formatKpi(key, summary[key])}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
