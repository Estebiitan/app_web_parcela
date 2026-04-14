from rest_framework.permissions import BasePermission

from apps.users.models import User


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsClientRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.role == User.Role.CLIENT)


class IsReservationOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return bool(request.user.is_authenticated and obj.customer_id == request.user.id)
