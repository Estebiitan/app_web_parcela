from django.contrib import admin

from .models import PaymentReceipt


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = (
        'public_id',
        'reservation',
        'review_status',
        'amount',
        'currency',
        'payment_date',
        'uploaded_by',
    )
    list_filter = ('review_status', 'currency')
    search_fields = (
        'public_id',
        'reservation__public_id',
        'reservation__customer__email',
        'reference_number',
    )
    autocomplete_fields = ('reservation', 'uploaded_by', 'reviewed_by')
    readonly_fields = ('public_id', 'created_at', 'updated_at')
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'public_id',
                    'reservation',
                    'uploaded_by',
                    'file',
                    'amount',
                    'currency',
                    'payment_date',
                    'reference_number',
                )
            },
        ),
        (
            'Review',
            {
                'fields': (
                    'review_status',
                    'review_notes',
                    'reviewed_by',
                    'reviewed_at',
                )
            },
        ),
        ('Details', {'fields': ('notes', 'metadata')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )

