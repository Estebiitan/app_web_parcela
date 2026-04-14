from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.api.serializers import PublicPropertyInfoSerializer
from apps.properties.selectors import get_active_property_info


@extend_schema(
    tags=['Public'],
    summary='Get public property information',
    responses={
        200: PublicPropertyInfoSerializer,
        404: OpenApiResponse(description='Active property information is not configured.'),
    },
)
class PublicPropertyInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        property_info = get_active_property_info()
        if not property_info:
            raise NotFound('Active property information is not configured.')

        serializer = PublicPropertyInfoSerializer(property_info)
        return Response(serializer.data)

