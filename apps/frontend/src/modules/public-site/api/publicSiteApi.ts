import { getJson } from '@/shared/api/http'
import type { ExperienceCard } from '@/modules/public-site/content/experienceCards'
import type { PropertyGalleryImage } from '@/modules/public-site/content/propertyMedia'
import type { PublicPricingRules } from '@/modules/public-site/pricing/pricingRules'

export type LocationMapPoint = {
  id: string
  label: string
  category: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  x: number
  y: number
  url: string
  isActive: boolean
}

export type LocationMapConfig = {
  venue: {
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    mapImageUrl: string
    mapNotes: string
  }
  points: LocationMapPoint[]
}

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
  pricing_rules: PublicPricingRules
  experience_cards: ExperienceCard[]
  gallery_images: PropertyGalleryImage[]
  hero_gallery_image_ids: string[]
  location_map: LocationMapConfig
}

export function getPublicPropertyInfo() {
  return getJson<PublicPropertyInfo>('public/property/')
}
