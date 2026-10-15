/**
 * Mis Eventos — Vista del Cliente.
 * Visualización de eventos propios, estado de pago y acciones (detalle, pago, reprogramar, cancelar).
 */
export function MyEventsPage() {
  return (
    <div className="space-y-6 p-6">
      <header className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Consulta el estado de tus reservas, fechas contratadas y comprobantes de pago.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No tienes eventos activos. Utiliza el cotizador para reservar tu próximo evento corporativo.
        </p>
      </div>
    </div>
  )
}

