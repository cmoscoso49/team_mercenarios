from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from apps.usuarios.permissions import CanAccessModulo
from .models import Evento, Participacion
from .serializers import EventoSerializer, EventoListSerializer, ParticipacionSerializer


class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['titulo', 'lugar', 'descripcion']
    ordering_fields = ['fecha', 'tipo', 'estado']
    ordering = ['-fecha']

    permission_classes = [CanAccessModulo('eventos')]

    def get_serializer_class(self):
        if self.action == 'list':
            return EventoListSerializer
        return EventoSerializer

    @action(detail=False, methods=['get'])
    def proximos(self, request):
        hoy = timezone.now().date()
        proximos = Evento.objects.filter(fecha__gte=hoy, estado='programado').order_by('fecha')[:10]
        serializer = EventoListSerializer(proximos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def participaciones(self, request, pk=None):
        evento = self.get_object()
        participaciones = Participacion.objects.filter(evento=evento)
        serializer = ParticipacionSerializer(participaciones, many=True)
        return Response(serializer.data)


class ParticipacionViewSet(viewsets.ModelViewSet):
    queryset = Participacion.objects.select_related('integrante', 'evento').all()
    serializer_class = ParticipacionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['integrante', 'evento', 'asistio']
    ordering = ['-evento__fecha']
