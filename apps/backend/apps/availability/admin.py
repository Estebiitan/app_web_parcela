from django.contrib import admin

from .models import BlockedDate


@admin.register(BlockedDate)
class BlockedDateAdmin(admin.ModelAdmin):
    list_display = ('title', 'block_type', 'start_date', 'end_date', 'is_active', 'created_by')
    list_filter = ('block_type', 'is_active')
    search_fields = ('title', 'reason')
    autocomplete_fields = ('created_by',)
    readonly_fields = ('public_id', 'created_at', 'updated_at')
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'public_id',
                    'title',
                    'block_type',
                    'start_date',
                    'end_date',
                    'is_active',
                )
            },
        ),
        ('Details', {'fields': ('reason', 'created_by', 'metadata')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )

