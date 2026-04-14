from rest_framework.routers import DefaultRouter

from .views import AdminBlockedDateViewSet

router = DefaultRouter()
router.register('admin/blocked-dates', AdminBlockedDateViewSet, basename='admin-blocked-date')

urlpatterns = router.urls

