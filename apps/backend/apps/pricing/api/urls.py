from rest_framework.routers import DefaultRouter

from .views import AdminSpecialDatePriceViewSet

router = DefaultRouter()
router.register('admin/special-prices', AdminSpecialDatePriceViewSet, basename='admin-special-price')

urlpatterns = router.urls

