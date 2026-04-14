from decimal import Decimal

from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateRangeField, RangeOperators
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Func, Q, Value

from apps.common.models import BaseModel


class SpecialDatePriceQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def overlapping(self, start_date, end_date):
        return self.filter(start_date__lte=end_date, end_date__gte=start_date)


class SpecialDatePrice(BaseModel):
    name = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()
    daily_price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='CLP')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    objects = SpecialDatePriceQuerySet.as_manager()

    class Meta:
        ordering = ('start_date', 'end_date')
        verbose_name = 'Special date price'
        verbose_name_plural = 'Special date prices'
        indexes = [
            models.Index(fields=('is_active', 'start_date', 'end_date')),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_date__gte=F('start_date')),
                name='pricing_special_date_price_valid_range',
            ),
            models.CheckConstraint(
                condition=Q(daily_price__gt=Decimal('0.00')),
                name='pricing_special_date_price_positive_amount',
            ),
            ExclusionConstraint(
                name='pricing_special_date_price_no_overlap_when_active',
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
                condition=Q(is_active=True),
            ),
        ]

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'End date must be on or after start date.'})
        if self.daily_price is not None and self.daily_price <= 0:
            raise ValidationError({'daily_price': 'Daily price must be greater than zero.'})
        if self.is_active and self.start_date and self.end_date:
            overlapping_prices = (
                SpecialDatePrice.objects.active()
                .overlapping(self.start_date, self.end_date)
                .exclude(pk=self.pk)
            )
            if overlapping_prices.exists():
                raise ValidationError('Special price range overlaps an existing active special price.')

        from apps.properties.selectors import get_active_property_info

        property_info = get_active_property_info()
        if property_info and self.currency != property_info.currency:
            raise ValidationError(
                {'currency': 'Special prices must use the same currency as the active property.'}
            )

    def __str__(self):
        return f'{self.name} ({self.start_date} - {self.end_date})'
