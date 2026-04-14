from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.common.models import BaseModel


class BlockedDateQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def overlapping(self, start_date, end_date):
        return self.filter(start_date__lte=end_date, end_date__gte=start_date)


class BlockedDate(BaseModel):
    class BlockType(models.TextChoices):
        MAINTENANCE = 'maintenance', 'Mantenimiento'
        OWNER_USE = 'owner_use', 'Uso interno'
        EVENT = 'event', 'Evento privado'
        OTHER = 'other', 'Otro'

    title = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()
    block_type = models.CharField(
        max_length=20,
        choices=BlockType.choices,
        default=BlockType.MAINTENANCE,
    )
    reason = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_blocked_dates',
    )
    metadata = models.JSONField(default=dict, blank=True)

    objects = BlockedDateQuerySet.as_manager()

    class Meta:
        ordering = ('start_date', 'end_date')
        verbose_name = 'Blocked date'
        verbose_name_plural = 'Blocked dates'
        indexes = [
            models.Index(fields=('is_active', 'start_date', 'end_date')),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_date__gte=models.F('start_date')),
                name='availability_blocked_date_valid_range',
            ),
        ]

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date must be on or after start date.'})
        if self.is_active and self.start_date and self.end_date:
            overlapping_blocks = (
                BlockedDate.objects.active()
                .overlapping(self.start_date, self.end_date)
                .exclude(pk=self.pk)
            )
            if overlapping_blocks.exists():
                raise ValidationError('Blocked date range overlaps an existing active blocked period.')

            from apps.reservations.models import Reservation

            if Reservation.objects.active().overlapping(self.start_date, self.end_date).exists():
                raise ValidationError('Blocked date range overlaps an active reservation.')

    def __str__(self):
        return f'{self.title} ({self.start_date} - {self.end_date})'
