import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader, Section } from '@/design-system'
import { GuestAccessNotice } from '@/modules/reservations/components/GuestAccessNotice'
import type { GuestReservationCreateResponse } from '@/modules/reservations/api/reservationsApi'
import { getLatestGuestReservationAccess } from '@/modules/reservations/lib/guestReservationAccessStore'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { LinkButton } from '@/shared/ui/LinkButton'

type ConfirmationLocationState = GuestReservationCreateResponse | null

export function GuestReservationConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = (location.state as ConfirmationLocationState) || null
  const latestAccess = getLatestGuestReservationAccess()

  const content = useMemo(() => {
    if (locationState) {
      return {
        reservation: locationState.reservation,
        guestAccess: locationState.guest_access,
      }
    }

    if (latestAccess) {
      return {
        reservation: null,
        guestAccess: latestAccess,
      }
    }

    return null
  }, [latestAccess, locationState])

  return (
    <div className="pb-16">
      <PageHeader
        description="La solicitud ya puede seguir su vida útil sin login. Guarda tus credenciales y reutilízalas para consultar el estado o adjuntar comprobantes."
        eyebrow="Solicitud enviada"
        metadata={<Badge tone="success">Flujo invitado activo</Badge>}
        title="Tu solicitud quedó registrada"
      />

      <Section
        description="Este es el punto clave del flujo invitado: el usuario debe conservar el identificador y token porque serán su acceso a seguimiento."
        title="Credenciales de seguimiento"
      >
        {content ? (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <GuestAccessNotice access={content.guestAccess} />

            <div className="grid gap-6">
              {content.reservation ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de tu solicitud</CardTitle>
                  </CardHeader>
                  <CardContent className="gap-3 text-sm leading-7 text-text-secondary">
                    <p>
                      Fechas:{' '}
                      <span className="text-text-primary">
                        {formatDate(content.reservation.start_date)} al {formatDate(content.reservation.end_date)}
                      </span>
                    </p>
                    <p>
                      Invitados:{' '}
                      <span className="text-text-primary">
                        {content.reservation.guest_count} personas
                      </span>
                    </p>
                    <p>
                      Monto referencial:{' '}
                      <span className="text-text-primary">
                        {formatCurrency(
                          content.reservation.quoted_total_amount,
                          content.reservation.currency,
                        )}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Siguiente paso recomendado</CardTitle>
                </CardHeader>
                <CardContent className="gap-4">
                  <p className="text-sm leading-7 text-text-secondary">
                    Puedes revisar el estado de inmediato o conservar los datos y volver cuando administración actualice la solicitud.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <LinkButton
                      state={{
                        accessToken: content.guestAccess.access_token,
                        reservationPublicId: content.guestAccess.reservation_public_id,
                      }}
                      to="/seguimiento"
                    >
                      Consultar estado
                    </LinkButton>
                    <LinkButton
                      state={{
                        accessToken: content.guestAccess.access_token,
                        reservationPublicId: content.guestAccess.reservation_public_id,
                      }}
                      to="/comprobante"
                      variant="secondary"
                    >
                      Subir comprobante
                    </LinkButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <FeedbackPanel
            actionLabel="Ir a seguimiento"
            description="No encontramos datos de una solicitud reciente en esta sesión. Si ya tienes tu identificador y token, puedes continuar directamente desde seguimiento."
            onAction={() => navigate('/seguimiento')}
            title="No hay credenciales disponibles en esta vista"
          />
        )}
      </Section>
    </div>
  )
}
