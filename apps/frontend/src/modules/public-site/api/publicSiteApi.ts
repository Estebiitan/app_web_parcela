import { getJson } from '@/shared/api/http'

export type PublicPropertyInfo = {
  public_id: string
  name: string
  short_description: string
  location_name: string
  address: string
  max_guest_count: number | null
  base_daily_price: string | null
  currency: string
  check_in_time: string | null
  check_out_time: string | null
  contact_email: string
  contact_phone: string
  amenities: string[]
}

export function getPublicPropertyInfo() {
  return getJson<PublicPropertyInfo>('public/property/')
}
