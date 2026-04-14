import secrets

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers

from apps.common.exceptions import ConflictError
from apps.pricing.services import calculate_quote
from apps.properties.selectors import get_active_property_info
from apps.reservations.models import (
    Reservation,
    ReservationGuestAccess,
    ReservationStatus,
    ReservationStatusHistory,
)
from apps.reservations.selectors import get_reservation_conflicts
from apps.users.models import User


def ensure_reservation_range_available(*, start_date, end_date):
    conflicts = get_reservation_conflicts(start_date, end_date)
    if conflicts['blocked_dates'].exists():
        raise ConflictError('The requested date range includes blocked dates.')
    if conflicts['reservations'].exists():
        raise ConflictError('The requested date range is not available for reservation.')


def _append_status_history(*, reservation, from_status, to_status, actor=None, comment='', metadata=None):
    ReservationStatusHistory.objects.create(
        reservation=reservation,
        from_status=from_status or '',
        to_status=to_status,
        changed_by=actor,
        comment=comment,
        metadata=metadata or {},
    )


def _split_contact_name(contact_name):
    normalized_name = (contact_name or '').strip()
    if not normalized_name:
        return '', ''
    first_name, _, last_name = normalized_name.partition(' ')
    return first_name, last_name.strip()


def _ensure_guest_count_within_property_capacity(guest_count):
    property_info = get_active_property_info()
    if (
        property_info
        and property_info.max_guest_count is not None
        and guest_count > property_info.max_guest_count
    ):
        raise serializers.ValidationError(
            {
                'guest_count': (
                    'Guest count exceeds the maximum capacity configured for the active property.'
                )
            }
        )


def _get_or_create_guest_customer(*, contact_email, contact_name='', contact_phone=''):
    normalized_email = User.objects.normalize_email(contact_email)
    first_name, last_name = _split_contact_name(contact_name)
    user, created = User.objects.get_or_create(
        email=normalized_email,
        defaults={
            'role': User.Role.CLIENT,
            'phone': contact_phone,
            'first_name': first_name,
            'last_name': last_name,
        },
    )

    if user.role != User.Role.CLIENT:
        raise serializers.ValidationError(
            {'contact_email': 'This email address cannot be used for guest reservations.'}
        )
    if not user.is_active:
        raise serializers.ValidationError(
            {'contact_email': 'This email address is not available for new reservations.'}
        )

    fields_to_update = []
    if contact_phone and not user.phone:
        user.phone = contact_phone
        fields_to_update.append('phone')
    if first_name and not user.first_name:
        user.first_name = first_name
        fields_to_update.append('first_name')
    if last_name and not user.last_name:
        user.last_name = last_name
        fields_to_update.append('last_name')

    if created:
        user.set_unusable_password()
        fields_to_update.append('password')

    if fields_to_update:
        user.save(update_fields=fields_to_update)

    return user


@transaction.atomic
def create_reservation(*, customer, validated_data):
    ensure_reservation_range_available(
        start_date=validated_data['start_date'],
        end_date=validated_data['end_date'],
    )
    _ensure_guest_count_within_property_capacity(validated_data['guest_count'])

    quote = calculate_quote(validated_data['start_date'], validated_data['end_date'])
    quoted_total_amount = quote['total_amount'] if quote else None
    currency = quote['currency'] if quote else 'CLP'

    reservation = Reservation(
        customer=customer,
        start_date=validated_data['start_date'],
        end_date=validated_data['end_date'],
        guest_count=validated_data['guest_count'],
        customer_message=validated_data.get('customer_message', ''),
        quoted_total_amount=quoted_total_amount,
        currency=currency,
        status=ReservationStatus.PENDING,
        status_updated_at=timezone.now(),
    )
    reservation.full_clean()
    reservation.save()

    _append_status_history(
        reservation=reservation,
        from_status='',
        to_status=ReservationStatus.PENDING,
        actor=customer,
        comment='Reservation request submitted.',
    )
    return reservation


@transaction.atomic
def create_guest_reservation(*, validated_data):
    reservation_data = {
        key: validated_data[key]
        for key in ('start_date', 'end_date', 'guest_count', 'customer_message')
        if key in validated_data
    }
    customer = _get_or_create_guest_customer(
        contact_email=validated_data['contact_email'],
        contact_name=validated_data.get('contact_name', ''),
        contact_phone=validated_data.get('contact_phone', ''),
    )
    normalized_email = User.objects.normalize_email(validated_data['contact_email'])
    reservation = create_reservation(customer=customer, validated_data=reservation_data)

    raw_access_token = secrets.token_urlsafe(24)
    guest_access = ReservationGuestAccess(
        reservation=reservation,
        contact_email=normalized_email,
        contact_name=validated_data.get('contact_name', ''),
        contact_phone=validated_data.get('contact_phone', ''),
    )
    guest_access.set_access_token(raw_access_token)
    guest_access.full_clean()
    guest_access.save()

    return reservation, guest_access, raw_access_token


def validate_guest_reservation_access(*, reservation, access_token):
    if not access_token:
        raise AuthenticationFailed('Reservation access token is required.')

    try:
        guest_access = reservation.guest_access
    except ReservationGuestAccess.DoesNotExist as exc:
        raise AuthenticationFailed('Guest access is not enabled for this reservation.') from exc

    if not guest_access.matches_token(access_token):
        raise AuthenticationFailed('Invalid reservation access token.')

    guest_access.last_used_at = timezone.now()
    guest_access.save(update_fields=['last_used_at', 'updated_at'])
    return guest_access


@transaction.atomic
def change_reservation_status(*, reservation, to_status, actor, comment='', status_reason=''):
    if not reservation.can_transition_to(to_status):
        raise serializers.ValidationError(
            {'status': f'Cannot transition reservation from {reservation.status} to {to_status}.'}
        )

    previous_status = reservation.status
    reservation.status = to_status
    reservation.status_reason = status_reason
    reservation.status_updated_at = timezone.now()
    reservation.full_clean()
    reservation.save(update_fields=['status', 'status_reason', 'status_updated_at', 'updated_at'])

    _append_status_history(
        reservation=reservation,
        from_status=previous_status,
        to_status=to_status,
        actor=actor,
        comment=comment,
    )
    return reservation


def approve_reservation(*, reservation, actor, comment=''):
    if reservation.status in {ReservationStatus.PENDING, ReservationStatus.OBSERVED}:
        return change_reservation_status(
            reservation=reservation,
            to_status=ReservationStatus.AWAITING_PAYMENT,
            actor=actor,
            comment=comment or 'Reservation approved and waiting for payment receipt.',
        )
    if reservation.status == ReservationStatus.PAYMENT_SUBMITTED:
        return change_reservation_status(
            reservation=reservation,
            to_status=ReservationStatus.CONFIRMED,
            actor=actor,
            comment=comment or 'Reservation payment approved and reservation confirmed.',
        )

    raise serializers.ValidationError(
        {'status': f'Reservation cannot be approved from status {reservation.status}.'}
    )


def reject_reservation(*, reservation, actor, reason, comment=''):
    return change_reservation_status(
        reservation=reservation,
        to_status=ReservationStatus.REJECTED,
        actor=actor,
        comment=comment or 'Reservation rejected by administration.',
        status_reason=reason,
    )
