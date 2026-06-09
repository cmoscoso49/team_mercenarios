from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Album, Foto, PublicacionInstagram
from .serializers import AlbumSerializer, AlbumListSerializer, FotoSerializer, PublicacionInstagramSerializer
from apps.usuarios.permissions import IsLiderazgo


class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.prefetch_related('fotos').all()
    serializer_class = AlbumSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['evento']
    search_fields = ['titulo', 'descripcion']
    ordering = ['-fecha_creacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return AlbumListSerializer
        return AlbumSerializer


class FotoViewSet(viewsets.ModelViewSet):
    queryset = Foto.objects.all()
    serializer_class = FotoSerializer
    permission_classes = [IsLiderazgo]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['album', 'destacada']
    ordering = ['-fecha_subida']


class PublicacionInstagramViewSet(viewsets.ModelViewSet):
    queryset = PublicacionInstagram.objects.all()
    serializer_class = PublicacionInstagramSerializer
    permission_classes = [IsLiderazgo]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['estado', 'destacado']
    ordering_fields = ['destacado', 'fecha_creacion', 'titulo']
    ordering = ['-destacado', '-fecha_creacion']
