import { postForm } from '@/shared/api/http'

export type PaymentReceiptCreatePayload = {
  accessToken: string
  reservationPublicId: string
  file: File
  amount?: string
  paymentDate?: string
  referenceNumber?: string
  notes?: string
}

export type PaymentReceiptDetail = {
  public_id: string
  amount: string | null
  currency: string
  payment_date: string | null
  reference_number: string
  notes: string
  review_status: string
  review_notes: string
  uploaded_by_email: string | null
  reviewed_at: string | null
  created_at: string
}

export function uploadGuestPaymentReceipt(payload: PaymentReceiptCreatePayload) {
  const formData = new FormData()
  formData.append('file', payload.file)

  if (payload.amount) {
    formData.append('amount', payload.amount)
  }
  if (payload.paymentDate) {
    formData.append('payment_date', payload.paymentDate)
  }
  if (payload.referenceNumber) {
    formData.append('reference_number', payload.referenceNumber)
  }
  if (payload.notes) {
    formData.append('notes', payload.notes)
  }

  return postForm<PaymentReceiptDetail>(
    `public/reservations/${payload.reservationPublicId}/payment-receipts/`,
    formData,
    {
      'X-Reservation-Access-Token': payload.accessToken,
    },
  )
}
