from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CurrentUserSerializer


class CurrentUserView(APIView):
    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
