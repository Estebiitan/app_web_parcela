import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Section, Textarea } from '@/design-system'
import {
  createGuestReservation,
  type GuestReservationCreatePayload,
} from '@/modules/reservations/api/reservationsApi'
import { saveGuestReservationAccess } from '@/modules/reservations/lib/guestReservationAccessStore'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import { getApiErrorMessage } from '@/shared/api/http'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'

type ReservationFormState = {
  contactName: string
  contactEmail: string
  contactPhone: string
  startDate: string
  endDate: string
  guestCount: string
  customerMessage: string
}

type ReservationFormErrors = Partial<Record<keyof ReservationFormState, string>>

function getInitialFormState(startDate = '', endDate = ''): ReservationFormState {
  return {
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    startDate,
    endDate,
    guestCount: '1',
    customerMessage: '',
  }
}

function validateReservationForm(
  formState: ReservationFormState,
  maxGuestCount: number | null | undefined,
) {
  const errors: ReservationFormErrors = {}

  if (!formState.contactName.trim()) {
    errors.contactName = 'Ingresa un nombre de contacto.'
  }
  if (!formState.contactEmail.trim()) {
    errors.contactEmail = 'Ingresa un correo electrónico.'
  }
  if (!formState.startDate) {
    errors.startDate = 'Selecciona una fecha de inicio.'
  }
  if (!formState.endDate) {
    errors.endDate = 'Selecciona una fecha de término.'
  }
  if (
    formState.startDate &&
    formState.endDate &&
    new Date(formState.endDate) < new Date(formState.startDate)
  ) {
    errors.endDate = 'La fecha de término no puede ser anterior a la de inicio.'
  }

  const guestCount = Number(formState.guestCount)
  if (!formState.guestCount || Number.isNaN(guestCount) || guestCount < 1) {
    errors.guestCount = 'Indica una cantidad válida de asistentes.'
  } else if (maxGuestCount && guestCount > maxGuestCount) {
    errors.guestCount = `La parcela acepta hasta ${maxGuestCount} personas en la configuración actual.`
  }

  return errors
}

export function GuestReservationRequestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: property } = usePropertyInfo()
  const [formState, setFormState] = useState(() =>
    getInitialFormState(
      searchParams.get('start_date') || '',
      searchParams.get('end_date') || '',
    ),
  )
  const [formErrors, setFormErrors] = useState<ReservationFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const infoItems = useMemo(
    () => [
      'La solicitud se envía sin necesidad de crear cuenta.',
      'Al finalizar recibirás un identificador y token de seguimiento.',
      'Con esas credenciales podrás revisar el estado y subir comprobantes.',
    ],
    [],
  )

  function updateField<Key extends keyof ReservationFormState>(
    field: Key,
    value: ReservationFormState[Key],
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateReservationForm(formState, property?.max_guest_count)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload: GuestReservationCreatePayload = {
      contact_name: formState.contactName.trim(),
      contact_email: formState.contactEmail.trim(),
      contact_phone: formState.contactPhone.trim(),
      start_date: formState.startDate,
      end_date: formState.endDate,
      guest_count: Number(formState.guestCount),
      customer_message: formState.customerMessage.trim(),
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const response = await createGuestReservation(payload)
      saveGuestReservationAccess(response.guest_access)
      navigate('/reservar/confirmacion', {
        state: response,
      })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        description="Completa la solicitud invitada. La reserva queda registrada en la API real y recibirás las credenciales para seguir el proceso sin login."
        eyebrow="Solicitud de reserva"
        title="Envía tu solicitud sin crear cuenta"
      />

      <Section
        description="Este formulario crea una reserva en estado pendiente y devuelve el identificador con token de seguimiento para el flujo invitado."
        title="Datos de contacto y fechas"
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Completa tu solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    error={formErrors.contactName}
                    id="reservation-contact-name"
                    label="Nombre de contacto"
                    onChange={(event) => updateField('contactName', event.target.value)}
                    required
                    value={formState.contactName}
                  />
                  <Input
                    error={formErrors.contactEmail}
                    id="reservation-contact-email"
                    label="Correo electrónico"
                    onChange={(event) => updateField('contactEmail', event.target.value)}
                    required
                    type="email"
                    value={formState.contactEmail}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    id="reservation-contact-phone"
                    label="Teléfono"
                    onChange={(event) => updateField('contactPhone', event.target.value)}
                    value={formState.contactPhone}
                  />
                  <Input
                    error={formErrors.startDate}
                    id="reservation-start-date"
                    label="Fecha de inicio"
                    onChange={(event) => updateField('startDate', event.target.value)}
                    required
                    type="date"
                    value={formState.startDate}
                  />
                  <Input
                    error={formErrors.endDate}
                    id="reservation-end-date"
                    label="Fecha de término"
                    onChange={(event) => updateField('endDate', event.target.value)}
                    required
                    type="date"
                    value={formState.endDate}
                  />
                </div>

                <Input
                  error={formErrors.guestCount}
                  hint={
                    property?.max_guest_count
                      ? `Capacidad máxima configurada: ${property.max_guest_count} personas.`
                      : 'La capacidad máxima aún no está informada.'
                  }
                  id="reservation-guest-count"
                  label="Cantidad de asistentes"
                  min={1}
                  onChange={(event) => updateField('guestCount', event.target.value)}
                  required
                  type="number"
                  value={formState.guestCount}
                />

                <Textarea
                  hint="Puedes dejar contexto sobre el tipo de actividad o alguna duda previa."
                  id="reservation-message"
                  label="Mensaje opcional"
                  onChange={(event) => updateField('customerMessage', event.target.value)}
                  placeholder="Ejemplo: reunión familiar, necesidad de horario especial, dudas sobre capacidad..."
                  value={formState.customerMessage}
                />

                {submitError ? (
                  <FeedbackPanel
                    description={submitError}
                    title="No fue posible enviar la solicitud"
                  />
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Qué ocurrirá después</CardTitle>
              </CardHeader>
              <CardContent className="gap-4">
                {infoItems.map((item, index) => (
                  <div
                    className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4"
                    key={item}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                      Paso {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-text-secondary">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos tomados desde la API pública</CardTitle>
              </CardHeader>
              <CardContent className="gap-3 text-sm leading-7 text-text-secondary">
                <p>
                  Parcela activa:{' '}
                  <span className="text-text-primary">{property?.name || 'Sin configurar'}</span>
                </p>
                <p>
                  Capacidad:{' '}
                  <span className="text-text-primary">
                    {property?.max_guest_count ? `${property.max_guest_count} personas` : 'No informada'}
                  </span>
                </p>
                <p>
                  Contacto:{' '}
                  <span className="text-text-primary">
                    {property?.contact_email || property?.contact_phone || 'No informado'}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  )
}
