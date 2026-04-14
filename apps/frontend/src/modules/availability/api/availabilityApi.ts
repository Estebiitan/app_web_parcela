import { getJson } from '@/shared/api/http'

export type AvailabilityConflict = {
  source: string
  start_date: string
  end_date: string
  block_type?: string
}

export type Quote = {
  total_amount: string
  currency: string
}

export type AvailabilityResponse = {
  start_date: string
  end_date: string
  is_available: boolean
  conflicts: AvailabilityConflict[]
  quote: Quote | null
}

export type AvailabilityQueryInput = {
  startDate: string
  endDate: string
}

export function getAvailability({ endDate, startDate }: AvailabilityQueryInput) {
  return getJson<AvailabilityResponse>('public/availability/', {
    start_date: startDate,
    end_date: endDate,
  })
}
