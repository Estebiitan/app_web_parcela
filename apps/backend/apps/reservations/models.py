import hashlib
from decimal import Decimal

from django.conf import settings
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateRangeField, RangeOperators
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Func, Q, Value
from django.utils.crypto import constant_time_compare
from django.utils import timezone

from apps.common.models import BaseModel


class ReservationStatus:
    PENDING = 'pending'
    OBSERVED = 'observed'
    AWAITING_PAYMENT = 'awaiting_payment'
    PAYMENT_SUBMITTED = 'payment_submitted'
    CONFIRMED = 'confirmed'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'

    CHOICES = (
        (PENDING, 'Pendiente'),
        (OBSERVED, 'Observada'),
        (AWAITING_PAYMENT, 'En espera de pago'),
        (PAYMENT_SUBMITTED, 'Comprobante enviado'),
        (CONFIRMED, 'Confirmada'),
        (REJECTED, 'Rechazada'),
        (CANCELLED, 'Cancelada'),
        (EXPIRED, 'Expirada'),
    )

    ACTIVE_HOLDING = (
        PENDING,
        OBSERVED,
        AWAITING_PAYMENT,
        PAYMENT_SUBMITTED,
        CONFIRMED,
    )

    TERMINAL = (
        REJECTED,
        CANCELLED,
        EXPIRED,
    )

    ALLOWED_TRANSITIONS = {
        PENDING: {OBSERVED, AWAITING_PAYMENT, REJECTED, CANCELLED, EXPIRED},
        OBSERVED: {AWAITING_PAYMENT, REJECTED, CANCELLED, EXPIRED},
        AWAITING_PAYMENT: {PAYMENT_SUBMITTED, CANCELLED, EXPIRED},
        PAYMENT_SUBMITTED: {OBSERVED, CONFIRMED, REJECTED},
        CONFIRMED: {CANCELLED},
        REJECTED: set(),
        CANCELLED: set(),
        EXPIRED: set(),
    }


class ReservationQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status__in=ReservationStatus.ACTIVE_HOLDING)

    def overlapping(self, start_date, end_date):
        return self.filter(start_date__lte=end_date, end_date__gte=start_date)

    def for_customer(self, customer):
        return self.filter(customer=customer)


class Reservation(BaseModel):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservations',
    )
    start_date = models.DateField()
    end_date = models.DateField()
    guest_count = models.PositiveSmallIntegerField(default=1)
    status = models.CharField(
        max_length=30,
        choices=ReservationStatus.CHOICES,
        default=ReservationStatus.PENDING,
    )
    quoted_total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    currency = models.CharField(max_length=3, default='CLP')
    customer_message = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    status_reason = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    status_updated_at = models.DateTimeField(default=timezone.now)

    objects = ReservationQuerySet.as_manager()

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'
        indexes = [
            models.Index(fields=('status', 'start_date', 'end_date')),
            models.Index(fields=('customer', 'status')),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_date__gte=F('start_date')),
                name='reservations_reservation_valid_range',
            ),
            models.CheckConstraint(
                condition=Q(guest_count__gte=1),
                name='reservations_reservation_guest_count_positive',
            ),
            models.CheckConstraint(
                condition=Q(quoted_total_amount__gt=Decimal('0.00'))
                | Q(quoted_total_amount__isnull=True),
                name='reservations_reservation_positive_quote_if_present',
            ),
            ExclusionConstraint(
                name='reservations_no_overlapping_active_reservations',
                expressions=[
                    (
                        Func(
                            F('start_date'),
                            F('end_date'),
                            Value('[]'),
                            function='daterange',
                            output_field=DateRangeField(),
                        ),
                        RangeOperators.OVERLAPS,
                    ),
                ],
                condition=Q(status__in=ReservationStatus.ACTIVE_HOLDING),
            ),
        ]

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date must be on or after start date.'})
        if self.quoted_total_amount is not None and self.quoted_total_amount <= 0:
            raise ValidationError(
                {'quoted_total_amount': 'Quoted total amount must be greater than zero.'}
            )
        if self.status in ReservationStatus.ACTIVE_HOLDING and self.start_date and self.end_date:
            overlapping_reservations = (
                Reservation.objects.active()
                .overlapping(self.start_date, self.end_date)
                .exclude(pk=self.pk)
            )
            if overlapping_reservations.exists():
                raise ValidationError('Reservation date range overlaps another active reservation.')

            from apps.availability.models import BlockedDate

            if BlockedDate.objects.active().overlapping(self.start_date, self.end_date).exists():
                raise ValidationError('Reservation date range overlaps blocked dates.')

    def can_transition_to(self, next_status):
        return next_status in ReservationStatus.ALLOWED_TRANSITIONS.get(self.status, set())

    @property
    def blocks_availability(self):
        return self.status in ReservationStatus.ACTIVE_HOLDING

    def __str__(self):
        return f'Reservation {self.public_id} - {self.customer}'


class ReservationStatusHistory(BaseModel):
    reservation = models.ForeignKey(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='status_history',
    )
    from_status = models.CharField(max_length=30, choices=ReservationStatus.CHOICES, blank=True)
    to_status = models.CharField(max_length=30, choices=ReservationStatus.CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservation_status_changes',
    )
    comment = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Reservation status history'
        verbose_name_plural = 'Reservation status history'
        indexes = [
            models.Index(fields=('reservation', 'created_at')),
            models.Index(fields=('to_status', 'created_at')),
        ]

    def clean(self):
        super().clean()
        if self.from_status and self.from_status == self.to_status:
            raise ValidationError({'to_status': 'Status transition must change the status.'})
        if self.from_status and self.to_status not in ReservationStatus.ALLOWED_TRANSITIONS.get(
            self.from_status, set()
        ):
            raise ValidationError(
                {'to_status': 'Status transition is not allowed for the provided source status.'}
            )

    def __str__(self):
        return f'{self.reservation_id}: {self.from_status or "initial"} -> {self.to_status}'


class ReservationGuestAccess(BaseModel):
    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='guest_access',
    )
    contact_email = models.EmailField()
    contact_name = models.CharField(max_length=150, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    access_token_hash = models.CharField(max_length=64, unique=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Reservation guest access'
        verbose_name_plural = 'Reservation guest access'
        indexes = [
            models.Index(fields=('contact_email', 'created_at')),
        ]

    @staticmethod
    def build_token_hash(raw_token):
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    def set_access_token(self, raw_token):
        self.access_token_hash = self.build_token_hash(raw_token)

    def matches_token(self, raw_token):
        return constant_time_compare(
            self.access_token_hash,
            self.build_token_hash(raw_token),
        )

    def __str__(self):
        return f'Guest access {self.public_id} - {self.contact_email}'
