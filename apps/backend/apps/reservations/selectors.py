from apps.availability.models import BlockedDate
from apps.pricing.services import calculate_quote
from apps.reservations.models import Reservation


def get_reservation_conflicts(start_date, end_date):
    reservations = Reservation.objects.active().overlapping(start_date, end_date)
    blocked_dates = BlockedDate.objects.active().overlapping(start_date, end_date)

    return {
        'reservations': reservations,
        'blocked_dates': blocked_dates,
    }


def get_availability_snapshot(start_date, end_date):
    conflicts = get_reservation_conflicts(start_date, end_date)
    quote = calculate_quote(start_date, end_date)

    blocked_ranges = [
        {
            'source': 'blocked_date',
            'start_date': blocked_date.start_date,
            'end_date': blocked_date.end_date,
            'block_type': blocked_date.block_type,
        }
        for blocked_date in conflicts['blocked_dates']
    ]
    reservation_ranges = [
        {
            'source': 'reservation',
            'start_date': reservation.start_date,
            'end_date': reservation.end_date,
        }
        for reservation in conflicts['reservations']
    ]

    return {
        'start_date': start_date,
        'end_date': end_date,
        'is_available': not conflicts['reservations'].exists() and not conflicts['blocked_dates'].exists(),
        'conflicts': blocked_ranges + reservation_ranges,
        'quote': quote,
    }

