from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from apps.usuarios.permissions import IsIntegrante
from .models import Integrante
from .serializers import IntegranteSerializer


def _get_integrante(user):
    try:
        return user.integrante
    except Exception:
        return None


@api_view(['GET', 'PATCH'])
@permission_classes([IsIntegrante])
def portal_me(request):
    integrante = _get_integrante(request.user)
    if not integrante:
        return Response(
            {'detail': 'Tu cuenta no está vinculada a un integrante del team. Contacta al administrador.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = IntegranteSerializer(integrante)
        return Response(serializer.data)

    # PATCH — solo nick, telefono, foto_perfil
    CAMPOS_EDITABLES = {'nick', 'telefono', 'foto_perfil'}
    data = {k: v for k, v in request.data.items() if k in CAMPOS_EDITABLES}
    serializer = IntegranteSerializer(integrante, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsIntegrante])
def portal_mis_cuotas(request):
    integrante = _get_integrante(request.user)
    if not integrante:
        return Response(
            {'detail': 'Cuenta no vinculada. Contacta al administrador.'},
            status=status.HTTP_404_NOT_FOUND
        )

    anio = request.query_params.get('anio', timezone.now().year)
    try:
        anio = int(anio)
    except (ValueError, TypeError):
        anio = timezone.now().year

    mensualidades = integrante.mensualidades.filter(anio=anio).order_by('mes')
    deudas_pendientes = integrante.deudas.exclude(estado='pagada').exclude(estado='condonada')

    meses_data = []
    for m in mensualidades:
        meses_data.append({
            'id': m.id,
            'mes': m.mes,
            'mes_display': m.get_mes_display(),
            'anio': m.anio,
            'monto': str(m.monto),
            'estado': m.estado,
            'estado_display': m.get_estado_display(),
            'fecha_pago': m.fecha_pago,
        })

    deudas_data = []
    for d in deudas_pendientes:
        deudas_data.append({
            'id': d.id,
            'descripcion': d.descripcion,
            'monto_total': str(d.monto_total),
            'monto_pagado': str(d.monto_pagado),
            'monto_pendiente': str(d.monto_total - d.monto_pagado),
            'estado': d.estado,
            'estado_display': d.get_estado_display(),
            'fecha_origen': d.fecha_origen,
            'fecha_vencimiento': d.fecha_vencimiento,
        })

    total_mensualidades = mensualidades.count()
    pagadas = mensualidades.filter(estado='pagada').count()
    pendientes = mensualidades.filter(estado='pendiente').count()

    return Response({
        'anio': anio,
        'resumen': {
            'total': total_mensualidades,
            'pagadas': pagadas,
            'pendientes': pendientes,
            'porcentaje_al_dia': round((pagadas / total_mensualidades * 100) if total_mensualidades else 0),
        },
        'mensualidades': meses_data,
        'deudas_pendientes': deudas_data,
    })


@api_view(['GET'])
@permission_classes([IsIntegrante])
def portal_mis_eventos(request):
    integrante = _get_integrante(request.user)
    if not integrante:
        return Response(
            {'detail': 'Cuenta no vinculada. Contacta al administrador.'},
            status=status.HTTP_404_NOT_FOUND
        )

    from apps.eventos.models import Evento
    hoy = timezone.now().date()

    proximos = Evento.objects.filter(
        estado='programado', fecha__gte=hoy
    ).order_by('fecha')[:10]

    historial_ids = integrante.participaciones.values_list('evento_id', flat=True)
    historial = Evento.objects.filter(id__in=historial_ids).order_by('-fecha')[:20]

    def evento_dict(ev, con_participacion=False):
        d = {
            'id': ev.id,
            'titulo': ev.titulo,
            'tipo': ev.tipo,
            'tipo_display': ev.get_tipo_display(),
            'fecha': ev.fecha,
            'hora': ev.hora,
            'lugar': ev.lugar,
            'estado': ev.estado,
            'estado_display': ev.get_estado_display(),
        }
        if con_participacion:
            part = integrante.participaciones.filter(evento=ev).first()
            d['asistio'] = part.asistio if part else None
        return d

    return Response({
        'proximos': [evento_dict(ev) for ev in proximos],
        'historial': [evento_dict(ev, con_participacion=True) for ev in historial],
    })
