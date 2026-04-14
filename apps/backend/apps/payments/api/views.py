from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.api.serializers import PaymentReceiptCreateSerializer, PaymentReceiptDetailSerializer
from apps.payments.services import submit_payment_receipt
from apps.reservations.models import Reservation
from apps.reservations.services import validate_guest_reservation_access
from apps.users.permissions import IsClientRole


def _get_reservation_access_token(request):
    return request.headers.get('X-Reservation-Access-Token', '').strip()


@extend_schema(
    tags=['Public Payments'],
    summary='Upload payment receipt without login',
    parameters=[
        OpenApiParameter(
            name='X-Reservation-Access-Token',
            required=True,
            type=str,
            location=OpenApiParameter.HEADER,
        )
    ],
    request=PaymentReceiptCreateSerializer,
    responses={
        201: PaymentReceiptDetailSerializer,
        401: OpenApiResponse(description='Missing or invalid reservation access token.'),
        409: OpenApiResponse(description='Reservation state conflicts with payment receipt upload.'),
    },
)
class PublicPaymentReceiptCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, reservation_public_id):
        reservation = get_object_or_404(
            Reservation.objects.select_related('customer', 'guest_access'),
            public_id=reservation_public_id,
        )
        validate_guest_reservation_access(
            reservation=reservation,
            access_token=_get_reservation_access_token(request),
        )
        serializer = PaymentReceiptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        receipt = submit_payment_receipt(
            reservation=reservation,
            uploaded_by=reservation.customer,
            validated_data=serializer.validated_data,
        )
        response_serializer = PaymentReceiptDetailSerializer(receipt, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Client Payments'],
    summary='Upload payment receipt for reservation',
    request=PaymentReceiptCreateSerializer,
    responses={
        201: PaymentReceiptDetailSerializer,
        409: OpenApiResponse(description='Reservation state conflicts with payment receipt upload.'),
    },
)
class ClientPaymentReceiptCreateView(APIView):
    permission_classes = [IsClientRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, reservation_public_id):
        reservation = get_object_or_404(
            Reservation.objects.all(),
            public_id=reservation_public_id,
            customer=request.user,
        )
        serializer = PaymentReceiptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        receipt = submit_payment_receipt(
            reservation=reservation,
            uploaded_by=request.user,
            validated_data=serializer.validated_data,
        )
        response_serializer = PaymentReceiptDetailSerializer(receipt, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
