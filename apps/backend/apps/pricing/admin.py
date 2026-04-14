from django.contrib import admin

from .models import SpecialDatePrice


@admin.register(SpecialDatePrice)
class SpecialDatePriceAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'daily_price', 'currency', 'is_active')
    list_filter = ('is_active', 'currency')
    search_fields = ('name', 'description')
    readonly_fields = ('public_id', 'created_at', 'updated_at')
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'public_id',
                    'name',
                    'start_date',
                    'end_date',
                    'daily_price',
                    'currency',
                    'is_active',
                )
            },
        ),
        ('Details', {'fields': ('description', 'metadata')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )

