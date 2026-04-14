from apps.availability.models import BlockedDate
from apps.common.exceptions import ConflictError
from apps.reservations.models import Reservation


def _validate_blocked_date_conflicts(start_date, end_date, *, instance=None):
    overlapping_blocks = BlockedDate.objects.active().overlapping(start_date, end_date)
    if instance:
        overlapping_blocks = overlapping_blocks.exclude(pk=instance.pk)

    if overlapping_blocks.exists():
        raise ConflictError('The blocked date range overlaps an existing active blocked period.')

    if Reservation.objects.active().overlapping(start_date, end_date).exists():
        raise ConflictError('The blocked date range overlaps an active reservation.')


def create_blocked_date(*, actor, data):
    _validate_blocked_date_conflicts(data['start_date'], data['end_date'])
    blocked_date = BlockedDate(created_by=actor, **data)
    blocked_date.full_clean()
    blocked_date.save()
    return blocked_date


def update_blocked_date(*, blocked_date, data):
    candidate_start = data.get('start_date', blocked_date.start_date)
    candidate_end = data.get('end_date', blocked_date.end_date)
    candidate_is_active = data.get('is_active', blocked_date.is_active)

    if candidate_is_active:
        _validate_blocked_date_conflicts(candidate_start, candidate_end, instance=blocked_date)

    for field, value in data.items():
        setattr(blocked_date, field, value)

    blocked_date.full_clean()
    blocked_date.save()
    return blocked_date

