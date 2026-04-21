import { publicPricingRules, type PublicPricingRules } from '@/modules/public-site/pricing/pricingRules'

export function clampNumber(value: number, minimum: number, maximum: number) {
  if (Number.isNaN(value)) {
    return minimum
  }

  return Math.min(Math.max(value, minimum), maximum)
}

export function normalizeGuestCount(
  value: number,
  rules: PublicPricingRules = publicPricingRules,
) {
  return Math.max(
    Number.isNaN(value) ? rules.minimumGuestCount : Math.trunc(value),
    rules.minimumGuestCount,
  )
}

export function normalizeVisibleGuestCount(
  value: number,
  rules: PublicPricingRules = publicPricingRules,
) {
  return clampNumber(
    normalizeGuestCount(value, rules),
    rules.minimumGuestCount,
    rules.visibleMaximumGuestCount,
  )
}

export function normalizeAdditionalHours(
  value: number,
  rules: PublicPricingRules = publicPricingRules,
) {
  return clampNumber(Math.trunc(value), 0, rules.maximumAdditionalHours)
}

export function calculateBasePrice(
  guestCount: number,
  rules: PublicPricingRules = publicPricingRules,
) {
  const normalizedGuestCount = normalizeGuestCount(guestCount, rules)

  if (normalizedGuestCount <= rules.firstTierMaximumGuestCount) {
    return rules.firstTierBasePrice
  }

  if (normalizedGuestCount <= rules.secondTierMaximumGuestCount) {
    return rules.secondTierBasePrice
  }

  return (
    rules.secondTierBasePrice +
    (normalizedGuestCount - rules.secondTierMaximumGuestCount) * rules.extraGuestPrice
  )
}

export function calculateTotalPrice(
  guestCount: number,
  additionalHours: number,
  rules: PublicPricingRules = publicPricingRules,
) {
  return (
    calculateBasePrice(guestCount, rules) +
    normalizeAdditionalHours(additionalHours, rules) * rules.additionalHourPrice
  )
}
