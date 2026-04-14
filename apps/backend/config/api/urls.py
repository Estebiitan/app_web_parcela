from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('', include('apps.common.api.urls')),
    path('auth/', include('apps.users.api.urls')),
    path('public/', include('apps.properties.api.urls')),
    path('', include('apps.reservations.api.urls')),
    path('', include('apps.payments.api.urls')),
    path('', include('apps.availability.api.urls')),
    path('', include('apps.pricing.api.urls')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
]
