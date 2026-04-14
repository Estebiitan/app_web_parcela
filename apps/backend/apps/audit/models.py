from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.common.models import BaseModel


class AuditLog(BaseModel):
    class Action(models.TextChoices):
        CREATED = 'created', 'Creado'
        UPDATED = 'updated', 'Actualizado'
        STATUS_CHANGED = 'status_changed', 'Cambio de estado'
        DELETED = 'deleted', 'Eliminado'
        NOTE_ADDED = 'note_added', 'Nota agregada'

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    summary = models.CharField(max_length=255)
    changes = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Audit log'
        verbose_name_plural = 'Audit logs'
        indexes = [
            models.Index(fields=('content_type', 'object_id')),
            models.Index(fields=('action', 'created_at')),
        ]

    def __str__(self):
        return f'{self.action} - {self.summary}'

