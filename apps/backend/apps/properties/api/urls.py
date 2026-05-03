from django.urls import path

from .views import AdminPropertyInfoView, PublicPropertyInfoView

urlpatterns = [
    path('public/property/', PublicPropertyInfoView.as_view(), name='public-property-info'),
    path('admin/property-settings/', AdminPropertyInfoView.as_view(), name='admin-property-settings'),
]
