from apps.properties.models import PropertyInfo


def get_active_property_info():
    return PropertyInfo.objects.active().first()

