import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Section,
} from '@/design-system'
import { getAvailability } from '@/modules/availability/api/availabilityApi'
import { publicPricingRules, type PublicPricingRules } from '@/modules/public-site/pricing/pricingRules'
import {
  calculateBasePrice,
  calculateDepositAmount,
  calculateTotalPrice,
  normalizeAdditionalHours,
  normalizeVisibleGuestCount,
} from '@/modules/public-site/pricing/pricingUtils'
import {
  buildReservationIntentSearchParams,
  createReservationPricingIntent,
} from '@/modules/reservations/lib/reservationIntent'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { LinkButton } from '@/shared/ui/LinkButton'

type PricingSectionProps = {
  onScheduleVisit?: () => void
  pricingRules?: PublicPricingRules
}

const scheduleHighlights = [
  'Ideal para jornadas completas, celebraciones y encuentros familiares.',
  'Las horas extra se suman solo cuando necesitas extender la actividad.',
] as const

const calendarWeekdays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const
const calendarLegendItems = [
  {
    key: 'available',
    label: 'Disponible',
    description: 'Fecha libre para simular y avanzar con tu reserva.',
    dotClassName: 'border-accent/35 bg-accent',
  },
  {
    key: 'reserved',
    label: 'Reservado',
    description: 'La parcela ya tiene una reserva activa ese dia.',
    dotClassName: 'border-warning/40 bg-warning',
  },
  {
    key: 'blocked',
    label: 'Bloqueado',
    description: 'No admite reservas para esa fecha.',
    dotClassName: 'border-border-soft bg-panel',
  },
] as const
const monthFormatter = new Intl.DateTimeFormat('es-CL', {
  month: 'long',
  year: 'numeric',
})

type CalendarDayStatus = 'available' | 'reserved' | 'blocked'

type CalendarDay = {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  status: CalendarDayStatus
}

type PriceSelectorGroupId = 'small' | 'medium' | 'variable'

type SelectedPriceGuests = Record<PriceSelectorGroupId, number>

function buildNumberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function addHoursToTime(time: string, hoursToAdd: number) {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + hoursToAdd * 60
  const normalizedHours = Math.floor((totalMinutes / 60) % 24)
  const normalizedMinutes = totalMinutes % 60

  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const totalMinutes = timeToMinutes(time) + minutesToAdd
  const normalizedHours = Math.floor((totalMinutes / 60) % 24)
  const normalizedMinutes = ((totalMinutes % 60) + 60) % 60

  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`
}

function createDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function buildCalendarGrid(monthDate: Date) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const mondayOffset = (monthStart.getDay() + 6) % 7
  const gridStart = addDays(monthStart, -mondayOffset)
  const sundayOffset = (7 - ((monthEnd.getDay() + 6) % 7) - 1 + 7) % 7
  const gridEnd = addDays(monthEnd, sundayOffset)
  const totalDays =
    Math.round((gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return Array.from({ length: totalDays }, (_, index) => addDays(gridStart, index))
}

function capitalizeText(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function resolveCalendarDayStatus(isAvailable: boolean, conflictSources: string[]): CalendarDayStatus {
  if (isAvailable) {
    return 'available'
  }

  return conflictSources.includes('reservation') ? 'reserved' : 'blocked'
}

function buildCalendarDaysFromConflicts(
  dates: Date[],
  visibleMonth: Date,
  conflicts: Array<{ source: string; start_date: string; end_date: string }>,
) {
  return dates.map((date) => {
    const dateKey = createDateKey(date)
    const dayConflicts = conflicts.filter(
      (conflict) => conflict.start_date <= dateKey && conflict.end_date >= dateKey,
    )

    return {
      date: dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth:
        date.getMonth() === visibleMonth.getMonth() &&
        date.getFullYear() === visibleMonth.getFullYear(),
      status: resolveCalendarDayStatus(
        dayConflicts.length === 0,
        dayConflicts.map((conflict) => conflict.source),
      ),
    } satisfies CalendarDay
  })
}

export function PricingSection({
  onScheduleVisit,
  pricingRules = publicPricingRules,
}: PricingSectionProps) {
  const [guestCount, setGuestCount] = useState<number>(pricingRules.minimumGuestCount)
  const [additionalHours, setAdditionalHours] = useState<number>(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState<string>(pricingRules.baseSchedule.start)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [isCalendarLoading, setIsCalendarLoading] = useState(true)
  const [selectedPriceGuests, setSelectedPriceGuests] = useState<SelectedPriceGuests>(() => ({
    small: pricingRules.minimumGuestCount,
    medium: pricingRules.firstTierMaximumGuestCount + 1,
    variable: pricingRules.secondTierMaximumGuestCount + 1,
  }))
  const calendarCacheRef = useRef(new Map<string, CalendarDay[]>())

  const priceSelectorGroups = useMemo(
    () => [
      {
        id: 'small' as const,
        basePrice: pricingRules.firstTierBasePrice,
        counts: buildNumberRange(
          pricingRules.minimumGuestCount,
          pricingRules.firstTierMaximumGuestCount,
        ),
      },
      {
        id: 'medium' as const,
        basePrice: pricingRules.secondTierBasePrice,
        counts: buildNumberRange(
          pricingRules.firstTierMaximumGuestCount + 1,
          pricingRules.secondTierMaximumGuestCount,
        ),
      },
      {
        id: 'variable' as const,
        basePrice: null,
        counts: buildNumberRange(
          pricingRules.secondTierMaximumGuestCount + 1,
          pricingRules.visibleMaximumGuestCount,
        ),
      },
    ],
    [pricingRules],
  )
  const basePrice = useMemo(
    () => calculateBasePrice(guestCount, pricingRules),
    [guestCount, pricingRules],
  )
  const totalPrice = useMemo(
    () => calculateTotalPrice(guestCount, additionalHours, pricingRules),
    [additionalHours, guestCount, pricingRules],
  )
  const totalPerPersonAmount = useMemo(
    () => Math.ceil(totalPrice / guestCount),
    [guestCount, totalPrice],
  )
  const depositAmount = useMemo(
    () => calculateDepositAmount(totalPrice, pricingRules),
    [pricingRules, totalPrice],
  )
  const baseScheduleDurationMinutes = useMemo(
    () => timeToMinutes(pricingRules.baseSchedule.end) - timeToMinutes(pricingRules.baseSchedule.start),
    [pricingRules],
  )
  const selectedScheduleDurationMinutes = useMemo(
    () => baseScheduleDurationMinutes + additionalHours * 60,
    [additionalHours, baseScheduleDurationMinutes],
  )
  const maximumExtendedEndTime = useMemo(
    () => addHoursToTime(pricingRules.baseSchedule.end, pricingRules.maximumAdditionalHours),
    [pricingRules],
  )
  const availableStartTimes = useMemo(() => {
    const earliestStart = timeToMinutes(pricingRules.baseSchedule.start)
    const latestStart = timeToMinutes(maximumExtendedEndTime) - selectedScheduleDurationMinutes

    if (latestStart <= earliestStart) {
      return [pricingRules.baseSchedule.start]
    }

    return Array.from(
      { length: Math.floor((latestStart - earliestStart) / 60) + 1 },
      (_, index) => addMinutesToTime(pricingRules.baseSchedule.start, index * 60),
    )
  }, [maximumExtendedEndTime, pricingRules, selectedScheduleDurationMinutes])
  const selectedEndTime = useMemo(
    () => addMinutesToTime(selectedStartTime, selectedScheduleDurationMinutes),
    [selectedScheduleDurationMinutes, selectedStartTime],
  )
  const reservationIntent = useMemo(
    () => createReservationPricingIntent(guestCount, additionalHours, pricingRules),
    [additionalHours, guestCount, pricingRules],
  )
  const visibleMonthLabel = useMemo(
    () => capitalizeText(monthFormatter.format(visibleMonth)),
    [visibleMonth],
  )
  const selectedDateLabel = useMemo(
    () => (selectedDate ? formatDate(selectedDate) : 'Sin fecha elegida'),
    [selectedDate],
  )
  const selectedDateBadgeText = useMemo(
    () => (selectedDate ? formatShortDate(selectedDate) : 'Sin fecha'),
    [selectedDate],
  )
  const reservationUrl = useMemo(() => {
    const searchParams = new URLSearchParams(buildReservationIntentSearchParams(reservationIntent))

    if (selectedDate) {
      searchParams.set('start_date', selectedDate)
      searchParams.set('end_date', selectedDate)
    }

    return `/reservar?${searchParams.toString()}`
  }, [reservationIntent, selectedDate])
  const calendarGrid = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth])

  function updateGuestCount(value: number) {
    setGuestCount(normalizeVisibleGuestCount(value, pricingRules))
  }

  function selectPriceGuestCount(groupId: PriceSelectorGroupId, value: number) {
    setSelectedPriceGuests((currentValue) => ({
      ...currentValue,
      [groupId]: value,
    }))
    updateGuestCount(value)
  }

  function updateAdditionalHours(value: number) {
    setAdditionalHours(normalizeAdditionalHours(value, pricingRules))
  }

  useEffect(() => {
    setGuestCount((currentValue) => normalizeVisibleGuestCount(currentValue, pricingRules))
    setAdditionalHours((currentValue) => normalizeAdditionalHours(currentValue, pricingRules))
    setSelectedStartTime(pricingRules.baseSchedule.start)
    setSelectedPriceGuests({
      small: pricingRules.minimumGuestCount,
      medium: pricingRules.firstTierMaximumGuestCount + 1,
      variable: pricingRules.secondTierMaximumGuestCount + 1,
    })
  }, [pricingRules])

  useEffect(() => {
    if (!availableStartTimes.includes(selectedStartTime)) {
      setSelectedStartTime(availableStartTimes[0])
    }
  }, [availableStartTimes, selectedStartTime])

  useEffect(() => {
    let isActive = true

    async function loadCalendarDays() {
      const rangeStart = createDateKey(calendarGrid[0])
      const rangeEnd = createDateKey(calendarGrid[calendarGrid.length - 1])
      const cacheKey = `${rangeStart}:${rangeEnd}`
      const cachedDays = calendarCacheRef.current.get(cacheKey)

      if (cachedDays) {
        setCalendarDays(cachedDays)
        setIsCalendarLoading(false)
        return
      }

      setIsCalendarLoading(true)

      try {
        const response = await getAvailability({
          startDate: rangeStart,
          endDate: rangeEnd,
        })

        if (!isActive) {
          return
        }

        const nextCalendarDays = buildCalendarDaysFromConflicts(
          calendarGrid,
          visibleMonth,
          response.conflicts,
        )

        calendarCacheRef.current.set(cacheKey, nextCalendarDays)
        setCalendarDays(nextCalendarDays)
      } catch (error) {
        if (!isActive) {
          return
        }

        setCalendarDays(
          calendarGrid.map((date) => ({
            date: createDateKey(date),
            dayNumber: date.getDate(),
            isCurrentMonth:
              date.getMonth() === visibleMonth.getMonth() &&
              date.getFullYear() === visibleMonth.getFullYear(),
            status: 'blocked',
          })),
        )
      } finally {
        if (isActive) {
          setIsCalendarLoading(false)
        }
      }
    }

    loadCalendarDays()

    return () => {
      isActive = false
    }
  }, [calendarGrid, visibleMonth])

  return (
    <Section
      className="relative overflow-hidden pt-10 sm:pt-14"
      eyebrow="Valores"
      title="Precios y horario"
      width="wide"
    >
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-72 bg-[radial-gradient(ellipse_at_center,rgba(132,188,105,0.16),transparent_62%)]" />
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <Card className="order-2 h-full bg-panel/86 shadow-soft lg:col-span-2">
          <CardContent className="grid gap-4 pt-6 xl:grid-cols-[0.85fr_1.55fr]">
            {priceSelectorGroups.map((group) => {
              const selectedCount = selectedPriceGuests[group.id]
              const groupTotal =
                group.basePrice ??
                pricingRules.secondTierBasePrice +
                  (selectedCount - pricingRules.secondTierMaximumGuestCount) *
                    pricingRules.extraGuestPrice
              const perPersonAmount = Math.ceil(groupTotal / selectedCount)
              const isVariableGroup = group.id === 'variable'
              const groupRangeLabel = `${group.counts[0]} a ${group.counts[group.counts.length - 1]} personas`

              return (
                <div
                  className={cn(
                    'relative isolate overflow-hidden rounded-[1.45rem] border border-accent/18 bg-[linear-gradient(145deg,rgb(var(--color-panel-muted)/0.96),rgb(var(--color-accent-soft)/0.34))] px-4 py-4 shadow-soft',
                    isVariableGroup && 'xl:col-span-2',
                  )}
                  key={group.id}
                >
                  <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-accent/10 blur-2xl" />
                  <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p
                        className="pricing-tier-value-pop font-display text-2xl leading-none text-text-primary"
                        key={`${group.id}-${groupTotal}`}
                      >
                        {formatCurrency(groupTotal)}
                      </p>
                      <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                        {groupRangeLabel}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-accent/20 bg-panel/82 px-4 py-3 text-right shadow-soft">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                        {selectedCount} personas
                      </p>
                      <p
                        className="pricing-tier-caption-pop mt-1 whitespace-nowrap font-display text-xl leading-none text-text-primary"
                        key={`${group.id}-${perPersonAmount}`}
                      >
                        {formatCurrency(perPersonAmount)}{' '}
                        <span className="font-sans text-xs font-semibold text-text-secondary">
                          por persona
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4 grid grid-cols-[repeat(auto-fit,minmax(2.55rem,1fr))] gap-2">
                    {group.counts.map((count) => {
                      const isSelected = selectedCount === count

                      return (
                        <button
                          aria-label={`Calcular valor por persona para ${count} personas`}
                          className={cn(
                            'group/person flex min-h-[3.45rem] items-center justify-center rounded-[1.1rem] border bg-panel/68 px-1.5 py-1 transition-[transform,border-color,background-color,box-shadow] duration-smooth ease-emphasized hover:-translate-y-1 hover:border-accent/42 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]',
                            isSelected &&
                              'border-accent/60 bg-accent-soft shadow-[0_1rem_2rem_rgba(132,188,105,0.2)]',
                          )}
                          key={count}
                          onClick={() => selectPriceGuestCount(group.id, count)}
                          type="button"
                        >
                          <span className="flex flex-col items-center">
                            <span
                              className={cn(
                                'h-3.5 w-3.5 rounded-full border border-accent/28 bg-panel shadow-[0_0.35rem_0.8rem_rgba(0,0,0,0.08)] transition-[background-color,transform] duration-smooth group-hover/person:-translate-y-0.5',
                                isSelected && 'bg-accent',
                              )}
                            />
                            <span
                              className={cn(
                                '-mt-0.5 flex h-7 w-7 items-center justify-center rounded-[1rem_1rem_0.75rem_0.75rem] border border-accent/25 bg-[linear-gradient(180deg,rgb(var(--color-panel)),rgb(var(--color-accent-soft)/0.82))] text-[0.64rem] font-bold text-text-primary shadow-soft transition-[background-color,color,transform] duration-smooth group-hover/person:translate-y-0.5',
                                isSelected && 'bg-accent text-accent-contrast',
                              )}
                            >
                              {count}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

          </CardContent>
        </Card>

        <Card className="order-1 h-full bg-panel/86 shadow-soft lg:col-span-2">
          <CardContent className="grid gap-4 pt-6 xl:grid-cols-[1.15fr_1.35fr_1fr]">
            <div className="rounded-[1.5rem] border border-border-soft bg-panel-muted px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                Horario incluido
              </p>
              <p className="mt-3 font-display text-3xl leading-tight text-text-primary">
                {pricingRules.baseSchedule.start} a {pricingRules.baseSchedule.end}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Hora adicional
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {formatCurrency(pricingRules.additionalHourPrice)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Maximo adicional
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {pricingRules.maximumAdditionalHours} horas
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Horario maximo
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {pricingRules.baseSchedule.start} a {maximumExtendedEndTime}
                </p>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-info/16 bg-[linear-gradient(145deg,rgb(var(--color-panel-muted)/0.94),rgb(var(--color-info-soft)/0.48))] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                Consideraciones
              </p>
              <div className="mt-3 grid gap-3">
                {scheduleHighlights.map((item) => (
                  <div
                    className="rounded-[1rem] border border-border-soft/75 bg-panel/72 px-3.5 py-3 text-sm leading-6 text-text-secondary"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div
          className="availability-scroll-target order-3 grid gap-6 pt-8 scroll-mt-28 sm:pt-10 lg:col-span-2"
          id="seccion-disponibilidad"
        >
          <div>
            <div className="max-w-3xl">
              <h3 className="font-display text-[clamp(1.8rem,1.45rem+0.8vw,2.4rem)] leading-tight text-text-primary">
                Disponibilidad
              </h3>
            </div>
          </div>

          <div className="grid items-stretch gap-5 xl:grid-cols-[1.86fr_1fr]">
            <Card className="availability-section-card overflow-hidden border-accent/20 bg-[linear-gradient(160deg,rgb(var(--color-panel)),rgb(var(--color-panel-muted)/0.98)_55%,rgb(var(--color-accent-soft)/0.28))] shadow-lift">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-[clamp(1.8rem,1.5rem+0.8vw,2.4rem)]">
                    {visibleMonthLabel}
                  </CardTitle>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 xl:flex-nowrap">
                  <div className="flex items-center gap-2 rounded-full border border-border-soft/80 bg-panel/78 px-2.5 py-2 shadow-soft">
                    {calendarLegendItems.map((item) => (
                      <button
                        aria-label={item.label}
                        className="group/legend relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-soft/70 bg-panel/72 transition-[transform,border-color,background-color,box-shadow] duration-swift ease-emphasized hover:-translate-y-px hover:border-accent/34 hover:bg-panel focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                        key={item.key}
                        type="button"
                      >
                        <span
                          className={cn(
                            'h-3.5 w-3.5 rounded-full border shadow-[0_0.45rem_0.95rem_rgba(0,0,0,0.18)]',
                            item.dotClassName,
                          )}
                        />
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 flex w-max max-w-[13rem] -translate-x-1/2 translate-y-2 flex-col rounded-[1.1rem] border border-accent/18 bg-[linear-gradient(145deg,rgb(var(--color-panel)),rgb(var(--color-panel-muted)/0.98)_68%,rgb(var(--color-accent-soft)/0.34))] px-3.5 py-3 text-left opacity-0 shadow-[0_1.25rem_2.8rem_rgba(0,0,0,0.24)] transition-[opacity,transform] duration-swift ease-emphasized group-hover/legend:translate-y-0 group-hover/legend:opacity-100 group-focus-visible/legend:translate-y-0 group-focus-visible/legend:opacity-100">
                          <span
                            aria-hidden="true"
                            className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[0.2rem] border-l border-t border-accent/18 bg-[rgb(var(--color-panel-muted))]"
                          />
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                            {item.label}
                          </span>
                          <span className="mt-1 text-sm leading-5 text-text-secondary">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex min-h-11 items-center rounded-full border border-border-soft bg-panel px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                    {selectedDateBadgeText}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      aria-label="Mes anterior"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-panel text-lg text-text-primary transition-[transform,border-color,background-color] duration-swift ease-emphasized hover:-translate-y-px hover:border-accent/40 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                      onClick={() => setVisibleMonth((currentMonth) => shiftMonth(currentMonth, -1))}
                      type="button"
                    >
                      <span aria-hidden="true">&larr;</span>
                    </button>
                    <button
                      aria-label="Mes siguiente"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-panel text-lg text-text-primary transition-[transform,border-color,background-color] duration-swift ease-emphasized hover:-translate-y-px hover:border-accent/40 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                      onClick={() => setVisibleMonth((currentMonth) => shiftMonth(currentMonth, 1))}
                      type="button"
                    >
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="gap-5">
              <div className="grid grid-cols-7 gap-3">
                {calendarWeekdays.map((day) => (
                  <div
                    className="rounded-full border border-border-soft/70 bg-panel/72 px-3 py-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {isCalendarLoading
                  ? Array.from({ length: 42 }).map((_, index) => (
                      <div
                        className="h-[6.85rem] animate-pulse rounded-[1.35rem] border border-border-soft bg-panel-muted/60"
                        key={`calendar-skeleton-${index}`}
                      />
                    ))
                  : calendarDays.map((day) => {
                      const isSelected = selectedDate === day.date
                      const isMonthNavigation = !day.isCurrentMonth
                      const isDisabled = !isMonthNavigation && day.status !== 'available'

                      return (
                        <button
                          className={cn(
                            'group relative flex min-h-[6.85rem] flex-col justify-between overflow-hidden rounded-[1.35rem] border p-2.5 text-left transition-[transform,border-color,background-color,box-shadow,opacity] duration-swift ease-emphasized hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]',
                            day.status === 'available' &&
                              'border-accent/18 bg-[linear-gradient(155deg,rgb(var(--color-accent-soft)/0.78),rgb(var(--color-panel)/0.88))] text-text-primary hover:border-accent/42 hover:shadow-[0_1rem_2rem_rgba(132,188,105,0.18)]',
                            day.status === 'reserved' &&
                              'border-warning/18 bg-[linear-gradient(155deg,rgb(var(--color-warning-soft)/0.76),rgb(var(--color-panel)/0.9))] text-text-primary',
                            day.status === 'blocked' &&
                              'border-border-soft bg-[linear-gradient(155deg,rgb(var(--color-panel-muted)/0.94),rgb(var(--color-panel)/0.92))] text-text-secondary',
                            !day.isCurrentMonth &&
                              '!border-border-soft/55 !bg-[rgb(var(--color-panel)/0.56)] !text-text-tertiary opacity-30 saturate-0 hover:opacity-52 hover:saturate-0',
                            isSelected &&
                              'border-accent/58 ring-2 ring-[rgb(var(--color-accent)/0.28)] shadow-[0_1.3rem_2.6rem_rgba(132,188,105,0.24)]',
                            isDisabled && 'cursor-not-allowed',
                          )}
                          disabled={isDisabled}
                          key={day.date}
                          onClick={() => {
                            if (isMonthNavigation) {
                              setVisibleMonth(startOfMonth(new Date(`${day.date}T00:00:00`)))
                              return
                            }

                            setSelectedDate(day.date)
                          }}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-[1.85rem] leading-none">{day.dayNumber}</p>
                            <span
                              className={cn(
                                'h-3 w-3 shrink-0 rounded-full border',
                                day.status === 'available' && 'border-accent/35 bg-accent',
                                day.status === 'reserved' && 'border-warning/40 bg-warning',
                                day.status === 'blocked' && 'border-border-soft bg-panel',
                                !day.isCurrentMonth && '!border-border-soft/55 !bg-transparent',
                              )}
                            />
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-inherit/75">
                              {isMonthNavigation
                                ? 'Ir al mes'
                                : day.status === 'available'
                                ? 'Disponible'
                                : day.status === 'reserved'
                                  ? 'Reservado'
                                  : 'Bloqueado'}
                            </p>
                            <p className="text-xs leading-[1.15rem] text-inherit/85">
                              {isMonthNavigation
                                ? 'Abre el mes correspondiente'
                                : isSelected
                                ? 'Elegido para simular'
                                : day.status === 'available'
                                  ? 'Toca para seleccionar'
                                  : 'No seleccionable'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
              </div>
            </CardContent>
          </Card>

            <Card className="availability-section-card relative overflow-hidden border-accent/24 bg-[linear-gradient(145deg,rgb(var(--color-panel)),rgb(var(--color-panel-muted)/0.98)_100%)] shadow-soft">
            <CardHeader className="relative">
              <CardTitle className="text-[clamp(1.5rem,1.3rem+0.55vw,1.95rem)]">
                Calcula tu valor estimado
              </CardTitle>
            </CardHeader>
            <CardContent className="relative gap-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1.5rem] border border-accent/20 bg-panel/78 px-5 py-5 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Fecha elegida
                  </p>
                  <p className="mt-3 font-display text-[clamp(1.05rem,0.95rem+0.45vw,1.35rem)] leading-tight text-text-primary">
                    {selectedDateLabel}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-accent/20 bg-panel/78 px-5 py-5 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Horas adicionales
                  </p>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {Array.from({ length: pricingRules.maximumAdditionalHours + 1 }).map(
                      (_, hour) => (
                        <button
                          className={cn(
                            'grid h-14 w-full place-items-center rounded-full border text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-swift ease-emphasized hover:-translate-y-px',
                            additionalHours === hour
                              ? 'border-accent/55 bg-accent text-accent-contrast shadow-[0_1rem_2rem_rgba(132,188,105,0.18)]'
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

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(10rem,0.9fr)]">
                <div className="rounded-[1.5rem] border border-accent/20 bg-panel/78 px-5 py-5 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Cantidad de personas
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="font-display text-4xl leading-none text-text-primary">
                      {guestCount}
                    </p>
                    <input
                      aria-label="Cantidad de personas"
                      className="h-11 w-24 rounded-full border border-border-soft bg-panel px-3 text-center text-base font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                      max={pricingRules.visibleMaximumGuestCount}
                      min={pricingRules.minimumGuestCount}
                      onChange={(event) => updateGuestCount(Number(event.target.value))}
                      type="number"
                      value={guestCount}
                    />
                  </div>
                  <div className="mt-5">
                    <input
                      aria-label="Selector de cantidad de personas"
                      className="h-2 w-full accent-[rgb(var(--color-accent))]"
                      max={pricingRules.visibleMaximumGuestCount}
                      min={pricingRules.minimumGuestCount}
                      onChange={(event) => updateGuestCount(Number(event.target.value))}
                      type="range"
                      value={guestCount}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-accent/20 bg-panel/78 px-4 py-5 shadow-soft">
                  <p className="text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Horario
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 place-items-center">
                    <div className="w-full rounded-[1rem] border border-accent/18 bg-accent-soft/30 px-2.5 py-3 text-center">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                        Inicio
                      </p>
                      <p className="mt-1 font-display text-[0.92rem] leading-none text-text-primary">
                        {selectedStartTime}
                      </p>
                    </div>
                    <div className="w-full rounded-[1rem] border border-border-soft bg-panel px-2.5 py-3 text-center">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                        Termino
                      </p>
                      <p className="mt-1 font-display text-[0.82rem] leading-none text-text-primary">
                        {selectedEndTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-accent/35 bg-[linear-gradient(135deg,rgb(var(--color-accent-soft)/0.72),rgb(var(--color-panel)/0.82))] px-5 py-5 shadow-[0_1.5rem_3rem_rgba(0,0,0,0.16)]">
                <div className="grid min-w-0 gap-4">
                  <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                        Base
                      </p>
                      <p className="mt-2 truncate text-lg font-semibold text-text-primary">
                        {formatCurrency(basePrice)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                        Extras
                      </p>
                      <p className="mt-2 truncate text-lg font-semibold text-text-primary">
                        {formatCurrency(additionalHours * pricingRules.additionalHourPrice)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                        Por persona
                      </p>
                      <p className="mt-2 truncate text-lg font-semibold text-text-primary">
                        {formatCurrency(totalPerPersonAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 border-t border-accent/18 pt-4 sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                      Total
                    </p>
                    <p
                      className="pricing-total-pop mt-2 max-w-full truncate font-display text-[clamp(2rem,1.4rem+1.5vw,2.9rem)] leading-none text-text-primary"
                      key={totalPrice}
                    >
                      {formatCurrency(totalPrice)}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                      Abono {formatCurrency(depositAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <LinkButton
                  className="h-11 rounded-full px-6 shadow-[0_1rem_2.2rem_rgba(132,188,105,0.18)]"
                  state={{ pricingIntent: reservationIntent }}
                  to={reservationUrl}
                >
                  Reservar ahora
                </LinkButton>
                <Button
                  className="h-11 rounded-full px-6"
                  onClick={onScheduleVisit}
                  variant="secondary"
                >
                  Agendar visita
                </Button>
              </div>

            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </Section>
  )
}
