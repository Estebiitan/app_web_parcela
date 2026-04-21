import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  Section,
  Textarea,
} from '@/design-system'
import { publicPricingRules } from '@/modules/public-site/pricing/pricingRules'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import {
  createGuestReservation,
  type GuestReservationCreatePayload,
} from '@/modules/reservations/api/reservationsApi'
import {
  buildReservationIntentMessage,
  parseReservationPricingIntent,
  type ReservationLocationState,
  type ReservationPricingIntent,
} from '@/modules/reservations/lib/reservationIntent'
import { saveGuestReservationAccess } from '@/modules/reservations/lib/guestReservationAccessStore'
import { getApiErrorMessage } from '@/shared/api/http'
import { formatCurrency } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { KeyValueList } from '@/shared/ui/KeyValueList'

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

function formatAdditionalHoursLabel(additionalHours: number) {
  if (additionalHours === 0) {
    return 'Sin horas adicionales'
  }

  return `${additionalHours} hora${additionalHours === 1 ? '' : 's'}`
}

function getInitialFormState({
  customerMessage = '',
  endDate = '',
  guestCount = String(publicPricingRules.minimumGuestCount),
  startDate = '',
}: Partial<
  Pick<ReservationFormState, 'customerMessage' | 'endDate' | 'guestCount' | 'startDate'>
> = {}): ReservationFormState {
  return {
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    startDate,
    endDate,
    guestCount,
    customerMessage,
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
    errors.contactEmail = 'Ingresa un correo electronico.'
  }
  if (!formState.startDate) {
    errors.startDate = 'Selecciona una fecha de inicio.'
  }
  if (!formState.endDate) {
    errors.endDate = 'Selecciona una fecha de termino.'
  }
  if (
    formState.startDate &&
    formState.endDate &&
    new Date(formState.endDate) < new Date(formState.startDate)
  ) {
    errors.endDate = 'La fecha de termino no puede ser anterior a la de inicio.'
  }

  const guestCount = Number(formState.guestCount)
  if (
    !formState.guestCount ||
    Number.isNaN(guestCount) ||
    guestCount < publicPricingRules.minimumGuestCount
  ) {
    errors.guestCount = `Indica al menos ${publicPricingRules.minimumGuestCount} asistentes.`
  } else if (maxGuestCount && guestCount > maxGuestCount) {
    errors.guestCount = `La parcela acepta hasta ${maxGuestCount} personas en la configuracion actual.`
  }

  return errors
}

function PricingIntentSummary({ pricingIntent }: { pricingIntent: ReservationPricingIntent }) {
  return (
    <div className="mb-5 rounded-[1.5rem] border border-accent/20 bg-accent-soft/55 px-5 py-5">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone="success">Tomado del simulador</Badge>
        <Badge tone="neutral">Total estimado {formatCurrency(pricingIntent.totalPrice)}</Badge>
      </div>
      <KeyValueList
        items={[
          {
            label: 'Asistentes fijados',
            value: `${pricingIntent.guestCount} personas`,
          },
          {
            label: 'Horas adicionales solicitadas',
            value: formatAdditionalHoursLabel(pricingIntent.additionalHours),
          },
          {
            label: 'Abono informado',
            value: formatCurrency(pricingIntent.depositAmount),
          },
        ]}
      />
    </div>
  )
}

export function GuestReservationRequestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const pricingIntent = useMemo(
    () =>
      parseReservationPricingIntent(
        searchParams,
        location.state as ReservationLocationState,
      ),
    [location.state, searchParams],
  )
  const { data: property } = usePropertyInfo()
  const [formState, setFormState] = useState(() =>
    getInitialFormState({
      customerMessage: pricingIntent ? buildReservationIntentMessage(pricingIntent) : '',
      endDate: searchParams.get('end_date') || '',
      guestCount: pricingIntent
        ? String(pricingIntent.guestCount)
        : searchParams.get('guest_count') || String(publicPricingRules.minimumGuestCount),
      startDate: searchParams.get('start_date') || '',
    }),
  )
  const [formErrors, setFormErrors] = useState<ReservationFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const infoItems = useMemo(
    () => [
      'La solicitud se envia sin necesidad de crear cuenta.',
      'Al finalizar recibiras un identificador y token de seguimiento.',
      'Con esas credenciales podras revisar el estado y subir comprobantes.',
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
        description="Completa la solicitud invitada. Si vienes desde el simulador, tus personas y horas adicionales quedan comunicadas en esta solicitud."
        eyebrow="Solicitud de reserva"
        title="Envia tu solicitud sin crear cuenta"
      />

      <Section
        description="Este formulario crea una reserva en estado pendiente y devuelve el identificador con token de seguimiento para el flujo invitado."
        title="Datos de contacto y fechas"
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Completa tu solicitud</CardTitle>
              {pricingIntent ? (
                <CardDescription>
                  Precargamos la cantidad de asistentes y el detalle del simulador para evitar
                  errores al enviar.
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              {pricingIntent ? <PricingIntentSummary pricingIntent={pricingIntent} /> : null}

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
                    label="Correo electronico"
                    onChange={(event) => updateField('contactEmail', event.target.value)}
                    required
                    type="email"
                    value={formState.contactEmail}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    id="reservation-contact-phone"
                    label="Telefono"
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
                    label="Fecha de termino"
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
                      ? `Capacidad maxima configurada: ${property.max_guest_count} personas.`
                      : `Minimo comercial del simulador: ${publicPricingRules.minimumGuestCount} personas.`
                  }
                  id="reservation-guest-count"
                  label="Cantidad de asistentes"
                  min={publicPricingRules.minimumGuestCount}
                  onChange={(event) => updateField('guestCount', event.target.value)}
                  required
                  type="number"
                  value={formState.guestCount}
                />

                <Textarea
                  hint={
                    pricingIntent
                      ? 'Este mensaje ya incluye el resumen del simulador. Puedes agregar mas contexto si lo necesitas.'
                      : 'Puedes dejar contexto sobre el tipo de actividad o alguna duda previa.'
                  }
                  id="reservation-message"
                  label="Mensaje opcional"
                  onChange={(event) => updateField('customerMessage', event.target.value)}
                  placeholder="Ejemplo: reunion familiar, necesidad de horario especial, dudas sobre capacidad..."
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
                <CardTitle>Que ocurrira despues</CardTitle>
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
                <CardTitle>Datos tomados desde la API publica</CardTitle>
              </CardHeader>
              <CardContent className="gap-3 text-sm leading-7 text-text-secondary">
                <p>
                  Parcela activa:{' '}
                  <span className="text-text-primary">{property?.name || 'Sin configurar'}</span>
                </p>
                <p>
                  Capacidad:{' '}
                  <span className="text-text-primary">
                    {property?.max_guest_count
                      ? `${property.max_guest_count} personas`
                      : 'No informada'}
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
