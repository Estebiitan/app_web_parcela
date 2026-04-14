from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reservations.api.serializers import (
    AdminReservationDetailSerializer,
    AdminReservationListSerializer,
    AvailabilityQuerySerializer,
    AvailabilityResponseSerializer,
    GuestReservationCreateResponseSerializer,
    GuestReservationCreateSerializer,
    ReservationApprovalSerializer,
    ReservationCreateSerializer,
    ReservationRejectionSerializer,
    ReservationStatusSerializer,
)
from apps.reservations.models import Reservation
from apps.reservations.selectors import get_availability_snapshot
from apps.reservations.services import (
    approve_reservation,
    create_guest_reservation,
    create_reservation,
    reject_reservation,
    validate_guest_reservation_access,
)
from apps.users.permissions import IsAdminRole, IsClientRole


def _get_reservation_access_token(request):
    return request.headers.get('X-Reservation-Access-Token', '').strip()


@extend_schema(
    tags=['Public'],
    summary='Check public availability for a date range',
    parameters=[
        OpenApiParameter(name='start_date', required=True, type=str),
        OpenApiParameter(name='end_date', required=True, type=str),
    ],
    responses={200: AvailabilityResponseSerializer},
)
class PublicAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = AvailabilityQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        snapshot = get_availability_snapshot(**serializer.validated_data)
        response_serializer = AvailabilityResponseSerializer(snapshot)
        return Response(response_serializer.data)


@extend_schema(
    tags=['Public Reservations'],
    summary='Create reservation request without login',
    request=GuestReservationCreateSerializer,
    responses={
        201: GuestReservationCreateResponseSerializer,
        409: OpenApiResponse(description='The requested date range is not available.'),
    },
)
class PublicReservationCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GuestReservationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation, guest_access, raw_access_token = create_guest_reservation(
            validated_data=serializer.validated_data
        )
        response_serializer = GuestReservationCreateResponseSerializer(
            {
                'reservation': reservation,
                'guest_access': {
                    'reservation_public_id': reservation.public_id,
                    'access_token': raw_access_token,
                    'contact_email': guest_access.contact_email,
                    'contact_name': guest_access.contact_name,
                    'contact_phone': guest_access.contact_phone,
                },
            },
            context={'request': request},
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Public Reservations'],
    summary='Get reservation status without login',
    parameters=[
        OpenApiParameter(
            name='X-Reservation-Access-Token',
            required=True,
            type=str,
            location=OpenApiParameter.HEADER,
        )
    ],
    responses={200: ReservationStatusSerializer},
)
class PublicReservationStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, public_id):
        reservation = get_object_or_404(
            Reservation.objects.select_related('customer', 'guest_access').prefetch_related(
                'status_history',
                'payment_receipts',
            ),
            public_id=public_id,
        )
        validate_guest_reservation_access(
            reservation=reservation,
            access_token=_get_reservation_access_token(request),
        )
        response_serializer = ReservationStatusSerializer(reservation, context={'request': request})
        return Response(response_serializer.data)


@extend_schema(
    tags=['Client Reservations'],
    summary='Create reservation request',
    request=ReservationCreateSerializer,
    responses={
        201: ReservationStatusSerializer,
        409: OpenApiResponse(description='The requested date range is not available.'),
    },
)
class ClientReservationCreateView(APIView):
    permission_classes = [IsClientRole]

    def post(self, request):
        serializer = ReservationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = create_reservation(customer=request.user, validated_data=serializer.validated_data)
        response_serializer = ReservationStatusSerializer(reservation, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Client Reservations'],
    summary='Get reservation status for the authenticated client',
    responses={200: ReservationStatusSerializer},
)
class ClientReservationStatusView(generics.RetrieveAPIView):
    serializer_class = ReservationStatusSerializer
    permission_classes = [IsClientRole]
    lookup_field = 'public_id'

    def get_queryset(self):
        return Reservation.objects.filter(customer=self.request.user).prefetch_related(
            'status_history',
            'payment_receipts',
        )


@extend_schema(
    tags=['Admin Reservations'],
    summary='List reservations for administration',
    responses={200: AdminReservationListSerializer(many=True)},
)
class AdminReservationListView(generics.ListAPIView):
    serializer_class = AdminReservationListSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Reservation.objects.select_related('customer').order_by('-created_at')


@extend_schema(
    tags=['Admin Reservations'],
    summary='Retrieve reservation detail for administration',
    responses={200: AdminReservationDetailSerializer},
)
class AdminReservationDetailView(generics.RetrieveAPIView):
    serializer_class = AdminReservationDetailSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'public_id'

    def get_queryset(self):
        return Reservation.objects.select_related('customer').prefetch_related(
            'status_history',
            'payment_receipts',
        )


@extend_schema(
    tags=['Admin Reservations'],
    summary='Approve reservation',
    request=ReservationApprovalSerializer,
    responses={200: AdminReservationDetailSerializer},
)
class AdminReservationApproveView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, public_id):
        reservation = get_object_or_404(Reservation.objects.select_related('customer'), public_id=public_id)
        serializer = ReservationApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = approve_reservation(
            reservation=reservation,
            actor=request.user,
            comment=serializer.validated_data.get('comment', ''),
        )
        response_serializer = AdminReservationDetailSerializer(reservation, context={'request': request})
        return Response(response_serializer.data)


@extend_schema(
    tags=['Admin Reservations'],
    summary='Reject reservation',
    request=ReservationRejectionSerializer,
    responses={200: AdminReservationDetailSerializer},
)
class AdminReservationRejectView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, public_id):
        reservation = get_object_or_404(Reservation.objects.select_related('customer'), public_id=public_id)
        serializer = ReservationRejectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = reject_reservation(
            reservation=reservation,
            actor=request.user,
            reason=serializer.validated_data['reason'],
            comment=serializer.validated_data.get('comment', ''),
        )
        response_serializer = AdminReservationDetailSerializer(reservation, context={'request': request})
        return Response(response_serializer.data)
