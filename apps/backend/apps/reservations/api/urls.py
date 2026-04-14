from django.urls import path

from .views import (
    AdminReservationApproveView,
    AdminReservationDetailView,
    AdminReservationListView,
    AdminReservationRejectView,
    ClientReservationCreateView,
    ClientReservationStatusView,
    PublicAvailabilityView,
    PublicReservationCreateView,
    PublicReservationStatusView,
)

urlpatterns = [
    path('public/availability/', PublicAvailabilityView.as_view(), name='public-availability'),
    path('public/reservations/', PublicReservationCreateView.as_view(), name='public-reservation-create'),
    path(
        'public/reservations/<uuid:public_id>/status/',
        PublicReservationStatusView.as_view(),
        name='public-reservation-status',
    ),
    path('client/reservations/', ClientReservationCreateView.as_view(), name='client-reservation-create'),
    path(
        'client/reservations/<uuid:public_id>/status/',
        ClientReservationStatusView.as_view(),
        name='client-reservation-status',
    ),
    path('admin/reservations/', AdminReservationListView.as_view(), name='admin-reservation-list'),
    path(
        'admin/reservations/<uuid:public_id>/',
        AdminReservationDetailView.as_view(),
        name='admin-reservation-detail',
    ),
    path(
        'admin/reservations/<uuid:public_id>/approve/',
        AdminReservationApproveView.as_view(),
        name='admin-reservation-approve',
    ),
    path(
        'admin/reservations/<uuid:public_id>/reject/',
        AdminReservationRejectView.as_view(),
        name='admin-reservation-reject',
    ),
]
