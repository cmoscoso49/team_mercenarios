from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from apps.usuarios.permissions import CanAccessModulo
from .models import Postulacion
from .serializers import PostulacionPublicaSerializer, PostulacionAdminSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def postulacion_publica(request):
    serializer = PostulacionPublicaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'mensaje': 'Postulación recibida correctamente. Te contactaremos pronto.'},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostulacionViewSet(viewsets.ModelViewSet):
    queryset = Postulacion.objects.all()
    serializer_class = PostulacionAdminSerializer
    permission_classes = [CanAccessModulo('reclutamiento')]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['nombre', 'nick', 'ciudad', 'email']
    ordering_fields = ['fecha_envio', 'nombre', 'estado']
    ordering = ['-fecha_envio']
