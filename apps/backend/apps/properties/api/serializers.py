from rest_framework import serializers

from apps.properties.models import PropertyInfo


class PublicPropertyInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyInfo
        fields = (
            'public_id',
            'name',
            'short_description',
            'location_name',
            'address',
            'max_guest_count',
            'base_daily_price',
            'currency',
            'check_in_time',
            'check_out_time',
            'contact_email',
            'contact_phone',
            'amenities',
        )

