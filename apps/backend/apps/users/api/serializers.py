from rest_framework import serializers

from apps.users.models import User


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'phone',
            'is_active',
        )
