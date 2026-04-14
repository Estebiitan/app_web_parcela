from datetime import timedelta
from decimal import Decimal

from rest_framework import serializers

from apps.common.exceptions import ConflictError
from apps.pricing.models import SpecialDatePrice
from apps.properties.selectors import get_active_property_info


def calculate_quote(start_date, end_date):
    property_info = get_active_property_info()
    if not property_info or property_info.base_daily_price is None:
        return None

    total = Decimal('0.00')
    current_date = start_date
    special_prices = list(
        SpecialDatePrice.objects.active().overlapping(start_date, end_date).order_by('start_date')
    )

    while current_date <= end_date:
        applicable_special_price = next(
            (
                special_price
                for special_price in special_prices
                if special_price.start_date <= current_date <= special_price.end_date
            ),
            None,
        )
        day_price = (
            applicable_special_price.daily_price
            if applicable_special_price
            else property_info.base_daily_price
        )
        total += day_price
        current_date += timedelta(days=1)

    return {
        'total_amount': total,
        'currency': property_info.currency,
    }


def _validate_special_price_data(*, data, instance=None):
    property_info = get_active_property_info()
    if property_info and data['currency'] != property_info.currency:
        raise serializers.ValidationError(
            {'currency': 'Special prices must use the same currency as the active property.'}
        )

    if data.get('is_active', True):
        overlapping = SpecialDatePrice.objects.active().overlapping(
            data['start_date'],
            data['end_date'],
        )
        if instance:
            overlapping = overlapping.exclude(pk=instance.pk)
        if overlapping.exists():
            raise ConflictError('The special price range overlaps an existing active special price.')


def create_special_date_price(*, data):
    _validate_special_price_data(data=data)
    special_price = SpecialDatePrice(**data)
    special_price.full_clean()
    special_price.save()
    return special_price


def update_special_date_price(*, special_price, data):
    candidate = {
        'start_date': data.get('start_date', special_price.start_date),
        'end_date': data.get('end_date', special_price.end_date),
        'currency': data.get('currency', special_price.currency),
        'is_active': data.get('is_active', special_price.is_active),
    }
    if candidate['is_active']:
        _validate_special_price_data(data=candidate, instance=special_price)

    for field, value in data.items():
        setattr(special_price, field, value)

    special_price.full_clean()
    special_price.save()
    return special_price
