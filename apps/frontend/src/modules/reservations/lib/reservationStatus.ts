import type { BadgeTone } from '@/design-system'

export function getReservationStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'observed':
      return 'Observada'
    case 'awaiting_payment':
      return 'Esperando comprobante'
    case 'payment_submitted':
      return 'Comprobante enviado'
    case 'confirmed':
      return 'Confirmada'
    case 'rejected':
      return 'Rechazada'
    case 'cancelled':
      return 'Cancelada'
    case 'expired':
      return 'Expirada'
    default:
      return status
  }
}

export function getReservationStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'rejected':
    case 'cancelled':
    case 'expired':
      return 'danger'
    case 'awaiting_payment':
    case 'payment_submitted':
      return 'accent'
    case 'observed':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function reservationNeedsPaymentReceipt(status: string) {
  return status === 'awaiting_payment' || status === 'payment_submitted'
}
