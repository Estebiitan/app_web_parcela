import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Section, Textarea } from '@/design-system'
import { uploadGuestPaymentReceipt, type PaymentReceiptDetail } from '@/modules/payments/api/paymentsApi'
import {
  findGuestReservationAccess,
  getLatestGuestReservationAccess,
} from '@/modules/reservations/lib/guestReservationAccessStore'
import { getApiErrorMessage } from '@/shared/api/http'
import { formatCurrency, formatDateTime } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'

type PaymentFormState = {
  reservationPublicId: string
  accessToken: string
  amount: string
  paymentDate: string
  referenceNumber: string
  notes: string
  file: File | null
}

type PaymentFormErrors = Partial<Record<keyof PaymentFormState, string>>

type PaymentLocationState = Partial<Pick<PaymentFormState, 'reservationPublicId' | 'accessToken'>> | null

function validatePaymentForm(formState: PaymentFormState) {
  const errors: PaymentFormErrors = {}

  if (!formState.reservationPublicId.trim()) {
    errors.reservationPublicId = 'Ingresa tu identificador de reserva.'
  }
  if (!formState.accessToken.trim()) {
    errors.accessToken = 'Ingresa tu token de seguimiento.'
  }
  if (!formState.file) {
    errors.file = 'Selecciona el archivo del comprobante.'
  }

  return errors
}

export function GuestPaymentReceiptPage() {
  const location = useLocation()
  const locationState = (location.state as PaymentLocationState) || null
  const latestAccess = getLatestGuestReservationAccess()
  const initialReservationPublicId =
    locationState?.reservationPublicId || latestAccess?.reservation_public_id || ''
  const initialAccessToken =
    locationState?.accessToken ||
    (initialReservationPublicId
      ? findGuestReservationAccess(initialReservationPublicId)?.access_token
      : latestAccess?.access_token) ||
    ''

  const [formState, setFormState] = useState<PaymentFormState>({
    reservationPublicId: initialReservationPublicId,
    accessToken: initialAccessToken,
    amount: '',
    paymentDate: '',
    referenceNumber: '',
    notes: '',
    file: null,
  })
  const [formErrors, setFormErrors] = useState<PaymentFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<PaymentReceiptDetail | null>(null)

  function updateField<Key extends keyof PaymentFormState>(
    field: Key,
    value: PaymentFormState[Key],
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validatePaymentForm(formState)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !formState.file) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const nextReceipt = await uploadGuestPaymentReceipt({
        reservationPublicId: formState.reservationPublicId.trim(),
        accessToken: formState.accessToken.trim(),
        file: formState.file,
        amount: formState.amount.trim(),
        paymentDate: formState.paymentDate,
        referenceNumber: formState.referenceNumber.trim(),
        notes: formState.notes.trim(),
      })
      setReceipt(nextReceipt)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      setReceipt(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        description="Adjunta el comprobante usando el mismo identificador y token entregados en la confirmación de la solicitud."
        eyebrow="Comprobante"
        title="Sube tu comprobante de pago"
      />

      <Section
        description="Esta pantalla consume el endpoint público de comprobantes y envía el token de seguimiento en el header que exige la API."
        title="Carga invitada de comprobante"
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Datos del comprobante</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    error={formErrors.reservationPublicId}
                    id="payment-reservation-public-id"
                    label="Identificador de reserva"
                    onChange={(event) => updateField('reservationPublicId', event.target.value)}
                    value={formState.reservationPublicId}
                  />
                  <Input
                    error={formErrors.accessToken}
                    id="payment-access-token"
                    label="Token de seguimiento"
                    onChange={(event) => updateField('accessToken', event.target.value)}
                    value={formState.accessToken}
                  />
                </div>

                <Input
                  error={formErrors.file}
                  id="payment-file"
                  label="Archivo del comprobante"
                  onChange={(event) => updateField('file', event.target.files?.[0] ?? null)}
                  type="file"
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    id="payment-amount"
                    label="Monto declarado"
                    onChange={(event) => updateField('amount', event.target.value)}
                    placeholder="85000"
                    type="number"
                    value={formState.amount}
                  />
                  <Input
                    id="payment-date"
                    label="Fecha de pago"
                    onChange={(event) => updateField('paymentDate', event.target.value)}
                    type="date"
                    value={formState.paymentDate}
                  />
                  <Input
                    id="payment-reference"
                    label="Referencia"
                    onChange={(event) => updateField('referenceNumber', event.target.value)}
                    placeholder="Transferencia / folio"
                    value={formState.referenceNumber}
                  />
                </div>

                <Textarea
                  id="payment-notes"
                  label="Notas opcionales"
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="Puedes agregar contexto si el comprobante requiere aclaración."
                  value={formState.notes}
                />

                {submitError ? (
                  <FeedbackPanel
                    description={submitError}
                    title="No fue posible subir el comprobante"
                  />
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? 'Subiendo comprobante...' : 'Enviar comprobante'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {receipt ? (
              <Card>
                <CardHeader>
                  <CardTitle>Comprobante recibido</CardTitle>
                </CardHeader>
                <CardContent className="gap-3 text-sm leading-7 text-text-secondary">
                  <p>
                    Monto declarado:{' '}
                    <span className="text-text-primary">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </span>
                  </p>
                  <p>
                    Estado de revisión:{' '}
                    <span className="text-text-primary">{receipt.review_status}</span>
                  </p>
                  <p>
                    Enviado el:{' '}
                    <span className="text-text-primary">{formatDateTime(receipt.created_at)}</span>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <FeedbackPanel
                description="Cuando el archivo se cargue correctamente, aquí verás el resumen devuelto por la API."
                title="Aún no hay comprobante cargado"
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recomendación para el usuario</CardTitle>
              </CardHeader>
              <CardContent className="gap-3 text-sm leading-7 text-text-secondary">
                <p>
                  Después de subir el comprobante, el siguiente paso es volver a seguimiento para confirmar que la reserva quedó con la nueva información disponible.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  )
}
