from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from apps.availability.api.serializers import BlockedDateAdminSerializer
from apps.availability.models import BlockedDate
from apps.availability.services import create_blocked_date, update_blocked_date
from apps.users.permissions import IsAdminRole


@extend_schema_view(
    list=extend_schema(tags=['Admin Availability'], summary='List blocked dates'),
    retrieve=extend_schema(tags=['Admin Availability'], summary='Retrieve blocked date details'),
    create=extend_schema(tags=['Admin Availability'], summary='Create blocked date'),
    partial_update=extend_schema(tags=['Admin Availability'], summary='Update blocked date'),
    destroy=extend_schema(tags=['Admin Availability'], summary='Delete blocked date'),
)
class AdminBlockedDateViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = BlockedDateAdminSerializer
    permission_classes = [IsAdminRole]
    queryset = BlockedDate.objects.select_related('created_by').order_by('start_date', 'end_date')
    lookup_field = 'public_id'

    def perform_create(self, serializer):
        serializer.instance = create_blocked_date(
            actor=self.request.user,
            data=serializer.validated_data,
        )

    def perform_update(self, serializer):
        serializer.instance = update_blocked_date(
            blocked_date=self.get_object(),
            data=serializer.validated_data,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

