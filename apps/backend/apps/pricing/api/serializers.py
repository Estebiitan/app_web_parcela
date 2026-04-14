from rest_framework import serializers

from apps.pricing.models import SpecialDatePrice


class SpecialDatePriceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpecialDatePrice
        fields = (
            'public_id',
            'name',
            'start_date',
            'end_date',
            'daily_price',
            'currency',
            'description',
            'is_active',
            'metadata',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'public_id',
            'created_at',
            'updated_at',
        )

