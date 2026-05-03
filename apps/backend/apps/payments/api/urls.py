from django.urls import path

from .views import AdminPaymentReceiptCreateView, ClientPaymentReceiptCreateView, PublicPaymentReceiptCreateView

urlpatterns = [
    path(
        'public/reservations/<uuid:reservation_public_id>/payment-receipts/',
        PublicPaymentReceiptCreateView.as_view(),
        name='public-payment-receipt-create',
    ),
    path(
        'client/reservations/<uuid:reservation_public_id>/payment-receipts/',
        ClientPaymentReceiptCreateView.as_view(),
        name='client-payment-receipt-create',
    ),
    path(
        'admin/reservations/<uuid:reservation_public_id>/payment-receipts/',
        AdminPaymentReceiptCreateView.as_view(),
        name='admin-payment-receipt-create',
    ),
]
