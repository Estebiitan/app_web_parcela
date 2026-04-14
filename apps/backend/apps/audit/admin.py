from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('summary', 'action', 'actor', 'content_type', 'object_id', 'created_at')
    list_filter = ('action', 'content_type')
    search_fields = ('summary', 'actor__email', 'object_id')
    autocomplete_fields = ('actor',)
    readonly_fields = ('public_id', 'created_at', 'updated_at')
