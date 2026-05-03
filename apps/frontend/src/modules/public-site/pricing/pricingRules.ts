export type PublicPricingRules = {
  currency: string
  minimumGuestCount: number
  visibleMaximumGuestCount: number
  firstTierMaximumGuestCount: number
  secondTierMaximumGuestCount: number
  firstTierBasePrice: number
  secondTierBasePrice: number
  extraGuestPrice: number
  baseSchedule: {
    start: string
    end: string
  }
  additionalHourPrice: number
  maximumAdditionalHours: number
  depositRate: number
  simulatorMicrocopy: string
}

export const publicPricingRules: PublicPricingRules = {
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
  depositRate: 0.5,
  simulatorMicrocopy: '',
}
