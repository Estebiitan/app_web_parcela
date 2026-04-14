from rest_framework import serializers

from apps.availability.models import BlockedDate


class BlockedDateAdminSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)

    class Meta:
        model = BlockedDate
        fields = (
            'public_id',
            'title',
            'start_date',
            'end_date',
            'block_type',
            'reason',
            'is_active',
            'created_by',
            'created_by_email',
            'metadata',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'public_id',
            'created_by',
            'created_by_email',
            'created_at',
            'updated_at',
        )

