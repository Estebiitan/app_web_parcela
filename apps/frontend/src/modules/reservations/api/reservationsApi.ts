import { getJson, postJson } from '@/shared/api/http'

export type ReservationStatusHistoryItem = {
  public_id: string
  from_status: string
  to_status: string
  comment: string
  changed_by_email: string | null
  created_at: string
}

export type PaymentReceiptSummary = {
  public_id: string
  amount: string | null
  currency: string
  payment_date: string | null
  reference_number: string
  review_status: string
  created_at: string
}

export type ReservationStatusResponse = {
  public_id: string
  start_date: string
  end_date: string
  guest_count: number
  status: string
  status_reason: string
  quoted_total_amount: string | null
  currency: string
  customer_message: string
  expires_at: string | null
  status_updated_at: string
  created_at: string
  status_history: ReservationStatusHistoryItem[]
  payment_receipts: PaymentReceiptSummary[]
}

export type GuestReservationAccess = {
  reservation_public_id: string
  access_token: string
  contact_email: string
  contact_name: string
  contact_phone: string
}

export type GuestReservationCreatePayload = {
  contact_name: string
  contact_email: string
  contact_phone?: string
  start_date: string
  end_date: string
  guest_count: number
  customer_message?: string
}

export type GuestReservationCreateResponse = {
  reservation: ReservationStatusResponse
  guest_access: GuestReservationAccess
}

export function createGuestReservation(payload: GuestReservationCreatePayload) {
  return postJson<GuestReservationCreateResponse, GuestReservationCreatePayload>(
    'public/reservations/',
    payload,
  )
}

export function getGuestReservationStatus(publicId: string, accessToken: string) {
  return getJson<ReservationStatusResponse>(
    `public/reservations/${publicId}/status/`,
    undefined,
    {
      'X-Reservation-Access-Token': accessToken,
    },
  )
}
