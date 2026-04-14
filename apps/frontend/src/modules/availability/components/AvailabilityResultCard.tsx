import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system'
import type { AvailabilityResponse } from '@/modules/availability/api/availabilityApi'
import { formatCurrency, formatDate } from '@/shared/lib/format'

type AvailabilityResultCardProps = {
  result: AvailabilityResponse
}

export function AvailabilityResultCard({ result }: AvailabilityResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={result.is_available ? 'success' : 'warning'}>
            {result.is_available ? 'Disponible' : 'No disponible'}
          </Badge>
        </div>
        <CardTitle>
          {formatDate(result.start_date)} al {formatDate(result.end_date)}
        </CardTitle>
        <CardDescription>
          {result.is_available
            ? 'El rango está libre según las reservas activas y bloqueos configurados.'
            : 'El rango presenta conflictos y no conviene continuar la solicitud con esas fechas.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-6">
        {result.quote ? (
          <div className="rounded-[1.5rem] border border-success/15 bg-success-soft/60 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
              Cotización estimada
            </p>
            <p className="mt-3 font-display text-[clamp(1.8rem,1.55rem+0.8vw,2.6rem)] leading-none text-text-primary">
              {formatCurrency(result.quote.total_amount, result.quote.currency)}
            </p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Esta referencia usa la tarifa base y los precios especiales configurados hoy para ese rango.
            </p>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border-soft bg-panel-muted px-5 py-5 text-sm leading-7 text-text-secondary">
            La parcela no tiene una tarifa base configurada, por lo que la API no puede calcular una cotización aún.
          </div>
        )}

        {result.conflicts.length > 0 ? (
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
              Conflictos detectados
            </p>
            {result.conflicts.map((conflict, index) => (
              <div
                className="rounded-[1.25rem] border border-warning/15 bg-warning-soft/65 px-4 py-4"
                key={`${conflict.source}-${conflict.start_date}-${index}`}
              >
                <p className="text-sm font-semibold text-text-primary">
                  {conflict.source === 'reservation' ? 'Reserva activa' : 'Bloqueo operativo'}
                </p>
                <p className="mt-1 text-sm leading-7 text-text-secondary">
                  {formatDate(conflict.start_date)} al {formatDate(conflict.end_date)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
