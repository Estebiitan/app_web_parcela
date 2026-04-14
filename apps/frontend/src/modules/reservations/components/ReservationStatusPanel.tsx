import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system'
import type { ReservationStatusResponse } from '@/modules/reservations/api/reservationsApi'
import {
  getReservationStatusLabel,
  getReservationStatusTone,
  reservationNeedsPaymentReceipt,
} from '@/modules/reservations/lib/reservationStatus'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/format'
import { KeyValueList } from '@/shared/ui/KeyValueList'

type ReservationStatusPanelProps = {
  reservation: ReservationStatusResponse
}

export function ReservationStatusPanel({ reservation }: ReservationStatusPanelProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={getReservationStatusTone(reservation.status)}>
              {getReservationStatusLabel(reservation.status)}
            </Badge>
            {reservationNeedsPaymentReceipt(reservation.status) ? (
              <Badge tone="accent">Acción de cliente activa</Badge>
            ) : null}
          </div>
          <CardTitle>Reserva {reservation.public_id}</CardTitle>
          <CardDescription>
            Última actualización: {formatDateTime(reservation.status_updated_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <KeyValueList
            items={[
              {
                label: 'Rango solicitado',
                value: `${formatDate(reservation.start_date)} al ${formatDate(reservation.end_date)}`,
              },
              {
                label: 'Cantidad de asistentes',
                value: `${reservation.guest_count} personas`,
              },
              {
                label: 'Cotización referencial',
                value: formatCurrency(reservation.quoted_total_amount, reservation.currency),
              },
            ]}
          />

          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                Mensaje del cliente
              </p>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {reservation.customer_message || 'No se dejó un mensaje adicional.'}
              </p>
            </div>

            {reservation.status_reason ? (
              <div className="rounded-[1.25rem] border border-warning/15 bg-warning-soft/65 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                  Motivo asociado al estado
                </p>
                <p className="mt-2 text-sm leading-7 text-text-primary">{reservation.status_reason}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Transiciones ya registradas por la API.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {reservation.status_history.length > 0 ? (
              reservation.status_history.map((entry) => (
                <div
                  className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4"
                  key={entry.public_id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-primary">
                      {getReservationStatusLabel(entry.to_status)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    {entry.comment || 'Sin comentario asociado.'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-text-secondary">
                Aún no hay transiciones adicionales registradas.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comprobantes</CardTitle>
            <CardDescription>Archivos ya asociados a esta reserva.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {reservation.payment_receipts.length > 0 ? (
              reservation.payment_receipts.map((receipt) => (
                <div
                  className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4"
                  key={receipt.public_id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </p>
                    <Badge tone={receipt.review_status === 'approved' ? 'success' : 'neutral'}>
                      {receipt.review_status === 'pending_review'
                        ? 'Pendiente de revisión'
                        : receipt.review_status === 'approved'
                          ? 'Aprobado'
                          : 'Rechazado'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    Referencia: {receipt.reference_number || 'Sin referencia'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-text-secondary">
                Todavía no hay comprobantes asociados a esta reserva.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
