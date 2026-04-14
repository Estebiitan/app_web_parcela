import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Section } from '@/design-system'
import {
  getGuestReservationStatus,
  type ReservationStatusResponse,
} from '@/modules/reservations/api/reservationsApi'
import {
  findGuestReservationAccess,
  getLatestGuestReservationAccess,
} from '@/modules/reservations/lib/guestReservationAccessStore'
import { reservationNeedsPaymentReceipt } from '@/modules/reservations/lib/reservationStatus'
import { ReservationStatusPanel } from '@/modules/reservations/components/ReservationStatusPanel'
import { getApiErrorMessage } from '@/shared/api/http'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { LinkButton } from '@/shared/ui/LinkButton'

type StatusFormState = {
  reservationPublicId: string
  accessToken: string
}

type StatusFormErrors = Partial<Record<keyof StatusFormState, string>>

type StatusLocationState = Partial<StatusFormState> | null

function validateStatusForm(formState: StatusFormState) {
  const errors: StatusFormErrors = {}

  if (!formState.reservationPublicId.trim()) {
    errors.reservationPublicId = 'Ingresa tu identificador de reserva.'
  }
  if (!formState.accessToken.trim()) {
    errors.accessToken = 'Ingresa tu token de seguimiento.'
  }

  return errors
}

export function GuestReservationStatusPage() {
  const location = useLocation()
  const locationState = (location.state as StatusLocationState) || null
  const latestAccess = getLatestGuestReservationAccess()
  const initialReservationPublicId =
    locationState?.reservationPublicId || latestAccess?.reservation_public_id || ''
  const initialAccessToken =
    locationState?.accessToken ||
    (initialReservationPublicId
      ? findGuestReservationAccess(initialReservationPublicId)?.access_token
      : latestAccess?.access_token) ||
    ''

  const [formState, setFormState] = useState<StatusFormState>({
    reservationPublicId: initialReservationPublicId,
    accessToken: initialAccessToken,
  })
  const [formErrors, setFormErrors] = useState<StatusFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservation, setReservation] = useState<ReservationStatusResponse | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateStatusForm(formState)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const nextReservation = await getGuestReservationStatus(
        formState.reservationPublicId.trim(),
        formState.accessToken.trim(),
      )
      setReservation(nextReservation)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      setReservation(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        description="Consulta tu solicitud invitada con el identificador y token entregados al momento de crearla."
        eyebrow="Seguimiento"
        title="Revisa el estado de tu reserva"
      />

      <Section
        description="El backend exige `public_id` más token por reserva. Esta pantalla ya respeta ese contrato y puede reutilizar credenciales guardadas localmente."
        title="Acceso por identificador"
      >
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Ingresa tus credenciales</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <Input
                  error={formErrors.reservationPublicId}
                  id="status-reservation-public-id"
                  label="Identificador de reserva"
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      reservationPublicId: event.target.value,
                    }))
                  }
                  placeholder="UUID devuelto al crear la solicitud"
                  value={formState.reservationPublicId}
                />
                <Input
                  error={formErrors.accessToken}
                  id="status-access-token"
                  label="Token de seguimiento"
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      accessToken: event.target.value,
                    }))
                  }
                  placeholder="Token entregado en la confirmación"
                  value={formState.accessToken}
                />

                {submitError ? (
                  <FeedbackPanel
                    description={submitError}
                    title="No fue posible consultar la reserva"
                  />
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? 'Consultando...' : 'Consultar estado'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {reservation ? (
              <>
                <ReservationStatusPanel reservation={reservation} />
                {reservationNeedsPaymentReceipt(reservation.status) ? (
                  <Card>
                    <CardContent className="gap-4 py-2">
                      <p className="text-sm leading-7 text-text-secondary">
                        Esta reserva sigue admitiendo comprobante en el flujo invitado.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <LinkButton
                          state={{
                            accessToken: formState.accessToken,
                            reservationPublicId: formState.reservationPublicId,
                          }}
                          to="/comprobante"
                        >
                          Ir a subir comprobante
                        </LinkButton>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : (
              <FeedbackPanel
                description="Cuando consultes una reserva válida, aquí aparecerán su estado, historial y comprobantes asociados."
                title="Todavía no hay una reserva cargada"
              />
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}
