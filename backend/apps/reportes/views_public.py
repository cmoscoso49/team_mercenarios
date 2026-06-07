from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def public_stats(request):
    from apps.integrantes.models import Integrante
    from apps.eventos.models import Evento
    hoy = timezone.now().date()
    return Response({
        'integrantes_activos': Integrante.objects.filter(estado='activo').count(),
        'eventos_proximos': Evento.objects.filter(fecha__gte=hoy, estado='programado').count(),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_eventos(request):
    from apps.eventos.models import Evento
    from apps.eventos.serializers import EventoListSerializer
    hoy = timezone.now().date()
    qs = Evento.objects.filter(fecha__gte=hoy, estado='programado').order_by('fecha')[:5]
    return Response(EventoListSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_noticias(request):
    from apps.noticias.models import Noticia
    from apps.noticias.serializers import NoticiaListSerializer
    qs = Noticia.objects.filter(
        estado='publicado', visibilidad='publica'
    ).order_by('-fecha_creacion')[:3]
    return Response(NoticiaListSerializer(qs, many=True).data)
