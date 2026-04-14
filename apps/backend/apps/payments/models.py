from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.common.models import BaseModel


class PaymentReceipt(BaseModel):
    class ReviewStatus(models.TextChoices):
        PENDING_REVIEW = 'pending_review', 'Pendiente de revision'
        APPROVED = 'approved', 'Aprobado'
        REJECTED = 'rejected', 'Rechazado'

    reservation = models.ForeignKey(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='payment_receipts',
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_payment_receipts',
    )
    file = models.FileField(upload_to='payment-receipts/%Y/%m/')
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='CLP')
    payment_date = models.DateField(null=True, blank=True)
    reference_number = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING_REVIEW,
    )
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_payment_receipts',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Payment receipt'
        verbose_name_plural = 'Payment receipts'
        indexes = [
            models.Index(fields=('reservation', 'review_status')),
            models.Index(fields=('review_status', 'created_at')),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=Decimal('0.00')) | Q(amount__isnull=True),
                name='payments_payment_receipt_positive_amount_if_present',
            ),
            models.CheckConstraint(
                condition=(
                    (
                        Q(review_status='pending_review')
                        & Q(reviewed_by__isnull=True)
                        & Q(reviewed_at__isnull=True)
                    )
                    | (
                        Q(review_status__in=('approved', 'rejected'))
                        & Q(reviewed_by__isnull=False)
                        & Q(reviewed_at__isnull=False)
                    )
                ),
                name='payments_payment_receipt_review_fields_consistent',
            ),
        ]

    def clean(self):
        super().clean()
        if self.amount is not None and self.amount <= 0:
            raise ValidationError({'amount': 'Amount must be greater than zero.'})
        if self.review_status == self.ReviewStatus.PENDING_REVIEW:
            if self.reviewed_by_id or self.reviewed_at:
                raise ValidationError(
                    'Pending review receipts cannot have reviewer information assigned yet.'
                )
        elif not self.reviewed_by_id or not self.reviewed_at:
            raise ValidationError(
                'Reviewed receipts must include both reviewed_by and reviewed_at.'
            )

    def __str__(self):
        return f'Receipt {self.public_id} - {self.reservation_id}'
