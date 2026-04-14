import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { PublicAppShell } from '@/app/layouts/PublicAppShell'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { DesignSystemPreviewPage } from '@/app/preview/DesignSystemPreviewPage'
import { AvailabilityPage } from '@/modules/availability/pages/AvailabilityPage'
import { GuestPaymentReceiptPage } from '@/modules/payments/pages/GuestPaymentReceiptPage'
import { HomePage } from '@/modules/public-site/pages/HomePage'
import { GuestReservationConfirmationPage } from '@/modules/reservations/pages/GuestReservationConfirmationPage'
import { GuestReservationRequestPage } from '@/modules/reservations/pages/GuestReservationRequestPage'
import { GuestReservationStatusPage } from '@/modules/reservations/pages/GuestReservationStatusPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicAppShell />}>
          <Route element={<HomePage />} path="/" />
          <Route element={<Navigate replace to="/" />} path="/parcela" />
          <Route element={<AvailabilityPage />} path="/disponibilidad" />
          <Route element={<GuestReservationRequestPage />} path="/reservar" />
          <Route element={<GuestReservationConfirmationPage />} path="/reservar/confirmacion" />
          <Route element={<GuestReservationStatusPage />} path="/seguimiento" />
          <Route element={<GuestPaymentReceiptPage />} path="/comprobante" />
        </Route>
        <Route element={<DesignSystemPreviewPage />} path="/lab/design-system" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}
