from django.contrib import admin

from .models import Reservation, ReservationGuestAccess, ReservationStatusHistory


class ReservationStatusHistoryInline(admin.TabularInline):
    model = ReservationStatusHistory
    extra = 0
    autocomplete_fields = ('changed_by',)
    readonly_fields = ('public_id', 'created_at', 'updated_at')


class ReservationGuestAccessInline(admin.StackedInline):
    model = ReservationGuestAccess
    extra = 0
    can_delete = False
    readonly_fields = (
        'public_id',
        'contact_email',
        'contact_name',
        'contact_phone',
        'last_used_at',
        'created_at',
        'updated_at',
    )


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'public_id',
        'customer',
        'status',
        'start_date',
        'end_date',
        'guest_count',
        'quoted_total_amount',
        'currency',
    )
    list_filter = ('status', 'currency')
    search_fields = ('public_id', 'customer__email', 'customer__first_name', 'customer__last_name')
    autocomplete_fields = ('customer',)
    readonly_fields = ('public_id', 'created_at', 'updated_at', 'status_updated_at')
    inlines = (ReservationGuestAccessInline, ReservationStatusHistoryInline)
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'public_id',
                    'customer',
                    'status',
                    'start_date',
                    'end_date',
                    'guest_count',
                )
            },
        ),
        (
            'Commercial details',
            {
                'fields': (
                    'quoted_total_amount',
                    'currency',
                    'expires_at',
                )
            },
        ),
        (
            'Notes',
            {
                'fields': (
                    'customer_message',
                    'internal_notes',
                    'status_reason',
                )
            },
        ),
        ('Audit', {'fields': ('created_at', 'updated_at', 'status_updated_at')}),
    )


@admin.register(ReservationStatusHistory)
class ReservationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'from_status', 'to_status', 'changed_by', 'created_at')
    list_filter = ('to_status',)
    search_fields = ('reservation__public_id', 'reservation__customer__email', 'comment')
    autocomplete_fields = ('reservation', 'changed_by')
    readonly_fields = ('public_id', 'created_at', 'updated_at')
