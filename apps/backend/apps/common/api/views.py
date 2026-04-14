from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class ApiRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                'service': 'app_web_parcela-api',
                'version': 'v1',
                'environment': settings.ENVIRONMENT,
                'endpoints': {
                    'health': request.build_absolute_uri('health/'),
                    'docs': request.build_absolute_uri('docs/'),
                    'schema': request.build_absolute_uri('schema/'),
                    'token': request.build_absolute_uri('auth/token/'),
                    'public_property': request.build_absolute_uri('public/property/'),
                    'public_availability': request.build_absolute_uri('public/availability/'),
                    'public_reservations': request.build_absolute_uri('public/reservations/'),
                    'authenticated_client_reservations': request.build_absolute_uri('client/reservations/'),
                    'admin_reservations': request.build_absolute_uri('admin/reservations/'),
                },
            }
        )


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                'status': 'ok',
                'service': 'app_web_parcela-api',
                'environment': settings.ENVIRONMENT,
                'timestamp': timezone.now(),
            }
        )
