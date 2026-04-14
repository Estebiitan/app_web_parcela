import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system'
import type { GuestReservationAccess } from '@/modules/reservations/api/reservationsApi'

type GuestAccessNoticeProps = {
  access: GuestReservationAccess
}

export function GuestAccessNotice({ access }: GuestAccessNoticeProps) {
  return (
    <Card className="border-accent/20 bg-accent-soft/55">
      <CardHeader>
        <CardTitle>Guarda tus credenciales de seguimiento</CardTitle>
        <CardDescription>
          Este flujo invitado no depende de una cuenta. Para volver a consultar tu reserva o subir un comprobante, necesitarás este identificador y token.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-[1.25rem] border border-accent/15 bg-canvas px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
            Identificador de reserva
          </p>
          <p className="mt-2 break-all font-mono text-sm text-text-primary">
            {access.reservation_public_id}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-accent/15 bg-canvas px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
            Token de seguimiento
          </p>
          <p className="mt-2 break-all font-mono text-sm text-text-primary">
            {access.access_token}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
