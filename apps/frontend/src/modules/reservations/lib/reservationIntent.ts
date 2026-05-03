import { publicPricingRules, type PublicPricingRules } from '@/modules/public-site/pricing/pricingRules'
import {
  calculateBasePrice,
  calculateDepositAmount,
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
  pricingRules: PublicPricingRules = publicPricingRules,
): ReservationPricingIntent {
  const normalizedGuestCount = normalizeVisibleGuestCount(guestCount, pricingRules)
  const normalizedAdditionalHours = normalizeAdditionalHours(additionalHours, pricingRules)
  const basePrice = calculateBasePrice(normalizedGuestCount, pricingRules)
  const additionalHoursAmount = normalizedAdditionalHours * pricingRules.additionalHourPrice
  const totalPrice = calculateTotalPrice(normalizedGuestCount, normalizedAdditionalHours, pricingRules)

  return {
    source: 'pricing-simulator',
    guestCount: normalizedGuestCount,
    additionalHours: normalizedAdditionalHours,
    basePrice,
    additionalHoursAmount,
    totalPrice,
    depositAmount: calculateDepositAmount(totalPrice, pricingRules),
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
  pricingRules: PublicPricingRules = publicPricingRules,
) {
  if (locationState?.pricingIntent?.source === 'pricing-simulator') {
    return createReservationPricingIntent(
      locationState.pricingIntent.guestCount,
      locationState.pricingIntent.additionalHours,
      pricingRules,
    )
  }

  const guestCount = Number(searchParams.get('guest_count'))
  const additionalHours = Number(searchParams.get('additional_hours') ?? 0)

  if (Number.isNaN(guestCount) || guestCount < pricingRules.minimumGuestCount) {
    return null
  }

  return createReservationPricingIntent(guestCount, additionalHours, pricingRules)
}

export function buildReservationIntentMessage(
  intent: ReservationPricingIntent,
  pricingRules: PublicPricingRules = publicPricingRules,
) {
  const baseSchedule = `${pricingRules.baseSchedule.start} a ${pricingRules.baseSchedule.end}`
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
