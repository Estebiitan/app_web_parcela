from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from apps.pricing.api.serializers import SpecialDatePriceAdminSerializer
from apps.pricing.models import SpecialDatePrice
from apps.pricing.services import create_special_date_price, update_special_date_price
from apps.users.permissions import IsAdminRole


@extend_schema_view(
    list=extend_schema(tags=['Admin Pricing'], summary='List special prices'),
    retrieve=extend_schema(tags=['Admin Pricing'], summary='Retrieve special price details'),
    create=extend_schema(tags=['Admin Pricing'], summary='Create special price'),
    partial_update=extend_schema(tags=['Admin Pricing'], summary='Update special price'),
    destroy=extend_schema(tags=['Admin Pricing'], summary='Delete special price'),
)
class AdminSpecialDatePriceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = SpecialDatePriceAdminSerializer
    permission_classes = [IsAdminRole]
    queryset = SpecialDatePrice.objects.order_by('start_date', 'end_date')
    lookup_field = 'public_id'

    def perform_create(self, serializer):
        serializer.instance = create_special_date_price(data=serializer.validated_data)

    def perform_update(self, serializer):
        serializer.instance = update_special_date_price(
            special_price=self.get_object(),
            data=serializer.validated_data,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

