from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
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


@api_view(['GET'])
@permission_classes([AllowAny])
def public_noticia_detail(request, pk):
    from apps.noticias.models import Noticia
    try:
        n = Noticia.objects.get(pk=pk, estado='publicado', visibilidad='publica')
    except Noticia.DoesNotExist:
        return Response({'error': 'Noticia no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    imagen_url = None
    if n.imagen:
        imagen_url = request.build_absolute_uri(n.imagen.url)
    return Response({
        'id': n.id,
        'titulo': n.titulo,
        'resumen': n.resumen,
        'contenido': n.contenido,
        'imagen': imagen_url,
        'fecha_publicacion': n.fecha_publicacion,
        'destacada': n.destacada,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_instagram(request):
    from apps.galeria.models import PublicacionInstagram
    qs = PublicacionInstagram.objects.filter(
        estado='publicada'
    ).order_by('-destacado', '-fecha_creacion')[:9]
    data = []
    for p in qs:
        imagen_url = request.build_absolute_uri(p.imagen.url) if p.imagen else None
        data.append({
            'id': p.id,
            'titulo': p.titulo,
            'texto': p.texto,
            'imagen': imagen_url,
            'url_publicacion': p.url_publicacion,
            'destacado': p.destacado,
            'fecha_creacion': p.fecha_creacion,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_evento_detail(request, pk):
    from apps.eventos.models import Evento
    try:
        e = Evento.objects.get(pk=pk)
    except Evento.DoesNotExist:
        return Response({'error': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    imagen_url = None
    if e.imagen_destacada:
        imagen_url = request.build_absolute_uri(e.imagen_destacada.url)
    return Response({
        'id': e.id,
        'titulo': e.titulo,
        'tipo': e.tipo,
        'tipo_display': e.get_tipo_display(),
        'fecha': e.fecha,
        'hora': e.hora,
        'lugar': e.lugar,
        'descripcion': e.descripcion,
        'estado': e.estado,
        'estado_display': e.get_estado_display(),
        'imagen_destacada': imagen_url,
    })
