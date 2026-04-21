export const publicPricingRules = {
  currency: 'CLP',
  minimumGuestCount: 10,
  visibleMaximumGuestCount: 60,
  firstTierMaximumGuestCount: 15,
  secondTierMaximumGuestCount: 30,
  firstTierBasePrice: 200000,
  secondTierBasePrice: 230000,
  extraGuestPrice: 5000,
  baseSchedule: {
    start: '09:00',
    end: '18:00',
  },
  additionalHourPrice: 20000,
  maximumAdditionalHours: 3,
  depositAmount: 20000,
  simulatorMicrocopy:
    'Las horas adicionales pueden solicitarse segun disponibilidad y confirmacion operativa.',
} as const

export type PublicPricingRules = typeof publicPricingRules
