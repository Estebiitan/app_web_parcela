import { useMemo, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Section,
} from '@/design-system'
import { publicPricingRules } from '@/modules/public-site/pricing/pricingRules'
import {
  calculateBasePrice,
  calculateTotalPrice,
  normalizeAdditionalHours,
  normalizeVisibleGuestCount,
} from '@/modules/public-site/pricing/pricingUtils'
import {
  buildReservationIntentSearchParams,
  createReservationPricingIntent,
} from '@/modules/reservations/lib/reservationIntent'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { LinkButton } from '@/shared/ui/LinkButton'

type PricingSectionProps = {
  onScheduleVisit?: () => void
}

const priceTiers = [
  {
    label: '10 a 15 personas',
    value: publicPricingRules.firstTierBasePrice,
    description: 'Valor base para grupos pequenos y celebraciones compactas.',
  },
  {
    label: '16 a 30 personas',
    value: publicPricingRules.secondTierBasePrice,
    description: 'Tarifa pensada para reuniones familiares o grupos medianos.',
  },
  {
    label: '31 o mas personas',
    value: null,
    description: `${formatCurrency(publicPricingRules.secondTierBasePrice)} + ${formatCurrency(
      publicPricingRules.extraGuestPrice,
    )} por persona extra sobre 30.`,
  },
] as const

export function PricingSection({ onScheduleVisit }: PricingSectionProps) {
  const [guestCount, setGuestCount] = useState<number>(publicPricingRules.minimumGuestCount)
  const [additionalHours, setAdditionalHours] = useState<number>(0)

  const basePrice = useMemo(() => calculateBasePrice(guestCount), [guestCount])
  const totalPrice = useMemo(
    () => calculateTotalPrice(guestCount, additionalHours),
    [additionalHours, guestCount],
  )
  const reservationIntent = useMemo(
    () => createReservationPricingIntent(guestCount, additionalHours),
    [additionalHours, guestCount],
  )
  const reservationUrl = `/reservar?${buildReservationIntentSearchParams(reservationIntent)}`

  function updateGuestCount(value: number) {
    setGuestCount(normalizeVisibleGuestCount(value))
  }

  function updateAdditionalHours(value: number) {
    setAdditionalHours(normalizeAdditionalHours(value))
  }

  return (
    <Section
      className="relative overflow-hidden"
      description="Entiende el valor base, el horario incluido y calcula rapidamente un estimado segun personas y horas adicionales."
      eyebrow="Valores"
      title="Precios y simulacion"
    >
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-72 bg-[radial-gradient(circle_at_center,rgba(132,188,105,0.13),transparent_58%)]" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_0.85fr_1.25fr]">
        <Card className="bg-panel/92">
          <CardHeader>
            <Badge tone="accent">Personas</Badge>
            <CardTitle>Precio base por grupo</CardTitle>
            <CardDescription>
              Tramos claros para entender cuanto cuesta antes de simular.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {priceTiers.map((tier) => (
              <div
                className="rounded-[1.35rem] border border-border-soft bg-panel-muted px-4 py-4"
                key={tier.label}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">{tier.label}</p>
                  <p className="font-display text-xl text-text-primary">
                    {tier.value ? formatCurrency(tier.value) : 'Variable'}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{tier.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-panel/92">
          <CardHeader>
            <Badge tone="info">Horario</Badge>
            <CardTitle>Jornada y extras</CardTitle>
            <CardDescription>
              El arriendo considera una jornada base con opcion de extender.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="rounded-[1.5rem] border border-border-soft bg-panel-muted px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                Horario incluido
              </p>
              <p className="mt-3 font-display text-3xl leading-tight text-text-primary">
                {publicPricingRules.baseSchedule.start} a {publicPricingRules.baseSchedule.end}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Hora adicional
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {formatCurrency(publicPricingRules.additionalHourPrice)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Maximo adicional
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {publicPricingRules.maximumAdditionalHours} horas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-accent/25 bg-[radial-gradient(circle_at_top_right,rgba(132,188,105,0.22),transparent_38%),rgb(var(--color-panel))] shadow-lift">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="success">Simulador</Badge>
              <Badge tone="neutral">Abono {formatCurrency(publicPricingRules.depositAmount)}</Badge>
            </div>
            <CardTitle className="text-3xl">Calcula tu valor estimado</CardTitle>
            <CardDescription>
              Ajusta personas y horas extra para ver el total antes de solicitar la reserva.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-6">
            <div className="grid gap-5">
              <div className="rounded-[1.5rem] border border-border-soft bg-panel-muted px-5 py-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                      Cantidad de personas
                    </p>
                    <p className="mt-2 font-display text-4xl leading-none text-text-primary">
                      {guestCount}
                    </p>
                  </div>
                  <input
                    aria-label="Cantidad de personas"
                    className="h-12 w-28 rounded-xl border border-border-soft bg-panel px-3 text-center text-lg font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                    max={publicPricingRules.visibleMaximumGuestCount}
                    min={publicPricingRules.minimumGuestCount}
                    onChange={(event) => updateGuestCount(Number(event.target.value))}
                    type="number"
                    value={guestCount}
                  />
                </div>
                <input
                  aria-label="Selector de cantidad de personas"
                  className="mt-5 h-2 w-full accent-[rgb(var(--color-accent))]"
                  max={publicPricingRules.visibleMaximumGuestCount}
                  min={publicPricingRules.minimumGuestCount}
                  onChange={(event) => updateGuestCount(Number(event.target.value))}
                  type="range"
                  value={guestCount}
                />
              </div>

              <div className="rounded-[1.5rem] border border-border-soft bg-panel-muted px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Horas adicionales
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {Array.from({ length: publicPricingRules.maximumAdditionalHours + 1 }).map(
                    (_, hour) => (
                      <button
                        className={cn(
                          'rounded-xl border px-3 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-swift ease-emphasized',
                          additionalHours === hour
                            ? 'border-accent/45 bg-accent text-accent-contrast shadow-soft'
                            : 'border-border-soft bg-panel text-text-secondary hover:border-accent/40 hover:bg-accent-soft hover:text-text-primary',
                        )}
                        key={hour}
                        onClick={() => updateAdditionalHours(hour)}
                        type="button"
                      >
                        {hour} h
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-accent/20 bg-accent-soft/55 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Base
                  </p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">
                    {formatCurrency(basePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Extras
                  </p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">
                    {formatCurrency(additionalHours * publicPricingRules.additionalHourPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                    Total
                  </p>
                  <p className="mt-2 font-display text-3xl leading-none text-text-primary">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <LinkButton state={{ pricingIntent: reservationIntent }} to={reservationUrl}>
                Reservar ahora
              </LinkButton>
              <Button onClick={onScheduleVisit} variant="secondary">
                Agendar visita
              </Button>
            </div>

            <p className="text-sm leading-7 text-text-secondary">
              {publicPricingRules.simulatorMicrocopy}
            </p>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
