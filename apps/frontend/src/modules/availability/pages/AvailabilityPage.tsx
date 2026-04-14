import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Section } from '@/design-system'
import { getAvailability, type AvailabilityResponse } from '@/modules/availability/api/availabilityApi'
import { AvailabilityResultCard } from '@/modules/availability/components/AvailabilityResultCard'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import { getApiErrorMessage } from '@/shared/api/http'
import { formatCurrency } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { LinkButton } from '@/shared/ui/LinkButton'

type AvailabilityFormState = {
  startDate: string
  endDate: string
}

type AvailabilityFormErrors = Partial<Record<keyof AvailabilityFormState, string>>

const initialFormState: AvailabilityFormState = {
  startDate: '',
  endDate: '',
}

function validateForm(formState: AvailabilityFormState) {
  const errors: AvailabilityFormErrors = {}

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
    errors.endDate = 'La fecha de término no puede ser anterior al inicio.'
  }

  return errors
}

export function AvailabilityPage() {
  const { data: property } = usePropertyInfo()
  const [formState, setFormState] = useState(initialFormState)
  const [formErrors, setFormErrors] = useState<AvailabilityFormErrors>({})
  const [result, setResult] = useState<AvailabilityResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateForm(formState)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const availability = await getAvailability(formState)
      setResult(availability)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      setResult(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        description="Consulta un rango de fechas antes de enviar la solicitud. El resultado usa la API pública real y respeta reservas activas, bloqueos y precios especiales."
        eyebrow="Disponibilidad"
        title="Revisa si la parcela está libre para tus fechas"
      />

      <Section
        description="La consulta no requiere login y te permite seguir con una solicitud de reserva invitada en el mismo flujo."
        title="Consulta pública por rango"
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Selecciona tus fechas</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    error={formErrors.startDate}
                    id="availability-start-date"
                    label="Fecha de inicio"
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        startDate: event.target.value,
                      }))
                    }
                    required
                    type="date"
                    value={formState.startDate}
                  />
                  <Input
                    error={formErrors.endDate}
                    id="availability-end-date"
                    label="Fecha de término"
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        endDate: event.target.value,
                      }))
                    }
                    required
                    type="date"
                    value={formState.endDate}
                  />
                </div>

                {property ? (
                  <div className="rounded-[1.5rem] border border-border-soft bg-panel-muted px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                      Contexto actual
                    </p>
                    <div className="mt-3 grid gap-2 text-sm leading-7 text-text-secondary">
                      <p>
                        Capacidad máxima:{' '}
                        <span className="text-text-primary">
                          {property.max_guest_count ? `${property.max_guest_count} personas` : 'No informada'}
                        </span>
                      </p>
                      <p>
                        Tarifa base:{' '}
                        <span className="text-text-primary">
                          {formatCurrency(property.base_daily_price, property.currency)}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : null}

                {submitError ? (
                  <FeedbackPanel
                    description={submitError}
                    title="No fue posible consultar la disponibilidad"
                  />
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? 'Consultando...' : 'Consultar disponibilidad'}
                  </Button>
                  <LinkButton to="/reservar" variant="ghost">
                    Ir directo a solicitud
                  </LinkButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {result ? (
              <>
                <AvailabilityResultCard result={result} />
                {result.is_available ? (
                  <Card>
                    <CardContent className="gap-4 py-2">
                      <p className="text-sm leading-7 text-text-secondary">
                        Si estas fechas te sirven, puedes continuar con la solicitud invitada y recibir tu identificador de seguimiento.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <LinkButton
                          to={`/reservar?start_date=${formState.startDate}&end_date=${formState.endDate}`}
                        >
                          Continuar con la solicitud
                        </LinkButton>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : (
              <FeedbackPanel
                description="Todavía no has consultado un rango. Aquí aparecerá si las fechas están libres y la cotización estimada."
                title="Aún no hay resultado"
              />
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}
