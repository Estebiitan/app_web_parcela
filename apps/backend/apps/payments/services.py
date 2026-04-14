from django.db import transaction
from rest_framework import serializers

from apps.payments.models import PaymentReceipt
from apps.reservations.models import ReservationStatus
from apps.reservations.services import change_reservation_status


@transaction.atomic
def submit_payment_receipt(*, reservation, uploaded_by, validated_data):
    if reservation.status not in (
        ReservationStatus.AWAITING_PAYMENT,
        ReservationStatus.PAYMENT_SUBMITTED,
    ):
        raise serializers.ValidationError(
            {'reservation': 'Payment receipts can only be uploaded for reservations awaiting payment review.'}
        )

    receipt = PaymentReceipt(
        reservation=reservation,
        uploaded_by=uploaded_by,
        file=validated_data['file'],
        amount=validated_data.get('amount'),
        currency=reservation.currency,
        payment_date=validated_data.get('payment_date'),
        reference_number=validated_data.get('reference_number', ''),
        notes=validated_data.get('notes', ''),
    )
    receipt.full_clean()
    receipt.save()

    if reservation.status == ReservationStatus.AWAITING_PAYMENT:
        change_reservation_status(
            reservation=reservation,
            to_status=ReservationStatus.PAYMENT_SUBMITTED,
            actor=uploaded_by,
            comment='Customer submitted a payment receipt.',
        )

    return receipt

