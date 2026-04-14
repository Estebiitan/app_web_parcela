from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.common.models import BaseModel


class PropertyInfoQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)


class PropertyInfo(BaseModel):
    name = models.CharField(max_length=150)
    short_description = models.TextField(blank=True)
    location_name = models.CharField(max_length=150, blank=True)
    address = models.TextField(blank=True)
    max_guest_count = models.PositiveSmallIntegerField(null=True, blank=True)
    base_daily_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    currency = models.CharField(max_length=3, default='CLP')
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    amenities = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    objects = PropertyInfoQuerySet.as_manager()

    class Meta:
        ordering = ('-is_active', '-updated_at')
        verbose_name = 'Property info'
        verbose_name_plural = 'Property info'
        constraints = [
            models.CheckConstraint(
                condition=Q(base_daily_price__gt=Decimal('0.00')) | Q(base_daily_price__isnull=True),
                name='properties_property_info_positive_base_daily_price_if_present',
            ),
            models.CheckConstraint(
                condition=Q(max_guest_count__gte=1) | Q(max_guest_count__isnull=True),
                name='properties_property_info_positive_max_guest_count_if_present',
            ),
            models.UniqueConstraint(
                fields=('is_active',),
                condition=Q(is_active=True),
                name='properties_property_info_single_active_record',
            ),
        ]

    def clean(self):
        super().clean()
        if self.base_daily_price is not None and self.base_daily_price <= 0:
            raise ValidationError({'base_daily_price': 'Base daily price must be greater than zero.'})
        if self.max_guest_count is not None and self.max_guest_count < 1:
            raise ValidationError({'max_guest_count': 'Max guest count must be at least one.'})

    def __str__(self):
        return self.name

