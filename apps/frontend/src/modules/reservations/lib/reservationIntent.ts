import { publicPricingRules } from '@/modules/public-site/pricing/pricingRules'
import {
  calculateBasePrice,
  calculateTotalPrice,
  normalizeAdditionalHours,
  normalizeVisibleGuestCount,
} from '@/modules/public-site/pricing/pricingUtils'
import { formatCurrency } from '@/shared/lib/format'

export type ReservationPricingIntent = {
  source: 'pricing-simulator'
  guestCount: number
  additionalHours: number
  basePrice: number
  additionalHoursAmount: number
  totalPrice: number
  depositAmount: number
}

export type ReservationLocationState = {
  pricingIntent?: ReservationPricingIntent
} | null

export function createReservationPricingIntent(
  guestCount: number,
  additionalHours: number,
): ReservationPricingIntent {
  const normalizedGuestCount = normalizeVisibleGuestCount(guestCount)
  const normalizedAdditionalHours = normalizeAdditionalHours(additionalHours)
  const basePrice = calculateBasePrice(normalizedGuestCount)
  const additionalHoursAmount = normalizedAdditionalHours * publicPricingRules.additionalHourPrice

  return {
    source: 'pricing-simulator',
    guestCount: normalizedGuestCount,
    additionalHours: normalizedAdditionalHours,
    basePrice,
    additionalHoursAmount,
    totalPrice: calculateTotalPrice(normalizedGuestCount, normalizedAdditionalHours),
    depositAmount: publicPricingRules.depositAmount,
  }
}

export function buildReservationIntentSearchParams(intent: ReservationPricingIntent) {
  const searchParams = new URLSearchParams()
  searchParams.set('guest_count', String(intent.guestCount))
  searchParams.set('additional_hours', String(intent.additionalHours))
  return searchParams.toString()
}

export function parseReservationPricingIntent(
  searchParams: URLSearchParams,
  locationState?: ReservationLocationState,
) {
  if (locationState?.pricingIntent?.source === 'pricing-simulator') {
    return createReservationPricingIntent(
      locationState.pricingIntent.guestCount,
      locationState.pricingIntent.additionalHours,
    )
  }

  const guestCount = Number(searchParams.get('guest_count'))
  const additionalHours = Number(searchParams.get('additional_hours') ?? 0)

  if (Number.isNaN(guestCount) || guestCount < publicPricingRules.minimumGuestCount) {
    return null
  }

  return createReservationPricingIntent(guestCount, additionalHours)
}

export function buildReservationIntentMessage(intent: ReservationPricingIntent) {
  const baseSchedule = `${publicPricingRules.baseSchedule.start} a ${publicPricingRules.baseSchedule.end}`
  const additionalHoursText =
    intent.additionalHours > 0
      ? `${intent.additionalHours} hora${intent.additionalHours === 1 ? '' : 's'} adicional${
          intent.additionalHours === 1 ? '' : 'es'
        }`
      : 'Sin horas adicionales'

  return [
    'Solicitud iniciada desde el simulador de precios.',
    `Asistentes seleccionados: ${intent.guestCount}.`,
    `Horario base: ${baseSchedule}.`,
    `Horas adicionales solicitadas: ${additionalHoursText}.`,
    `Estimacion visual mostrada: ${formatCurrency(intent.totalPrice)}.`,
    `Abono informado: ${formatCurrency(intent.depositAmount)}.`,
  ].join('\n')
}
