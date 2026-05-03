from apps.properties.models import PropertyInfo


def get_active_property_info():
    return PropertyInfo.objects.active().first()


def get_or_create_active_property_info():
    property_info = get_active_property_info()
    if property_info:
        return property_info

    return PropertyInfo.objects.create(
        name='Parcela recreativa',
        short_description='Configura aqui el contenido publico de la parcela.',
        is_active=True,
    )
