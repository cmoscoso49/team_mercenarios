from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Noticia
from .serializers import NoticiaSerializer, NoticiaListSerializer


class NoticiaViewSet(viewsets.ModelViewSet):
    queryset = Noticia.objects.all()
    serializer_class = NoticiaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'visibilidad', 'destacada']
    search_fields = ['titulo', 'resumen', 'contenido']
    ordering_fields = ['fecha_creacion', 'fecha_publicacion']
    ordering = ['-fecha_creacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return NoticiaListSerializer
        return NoticiaSerializer

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)
