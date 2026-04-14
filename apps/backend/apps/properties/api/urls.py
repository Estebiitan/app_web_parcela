from django.urls import path

from .views import PublicPropertyInfoView

urlpatterns = [
    path('property/', PublicPropertyInfoView.as_view(), name='public-property-info'),
]

