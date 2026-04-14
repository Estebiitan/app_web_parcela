from django.contrib import admin

from .models import PropertyInfo


@admin.register(PropertyInfo)
class PropertyInfoAdmin(admin.ModelAdmin):
    list_display = ('name', 'location_name', 'max_guest_count', 'base_daily_price', 'currency', 'is_active')
    list_filter = ('is_active', 'currency')
    search_fields = ('name', 'location_name', 'contact_email', 'contact_phone')
    readonly_fields = ('public_id', 'created_at', 'updated_at')
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'public_id',
                    'name',
                    'short_description',
                    'location_name',
                    'address',
                    'is_active',
                )
            },
        ),
        (
            'Commercial details',
            {
                'fields': (
                    'max_guest_count',
                    'base_daily_price',
                    'currency',
                    'check_in_time',
                    'check_out_time',
                )
            },
        ),
        ('Contact', {'fields': ('contact_email', 'contact_phone', 'amenities')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )

