import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import redirect
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.finanzas.models import Categoria, Mensualidad, Movimiento
from apps.usuarios.permissions import IsIntegrante

from .models import PagoOnline
from .serializers import PagoOnlineSerializer
from . import services


def _get_integrante(user):
    """Returns integrante linked to user, or raises AttributeError."""
    return user.integrante


@api_view(['POST'])
@permission_classes([IsIntegrante])
@ratelimit(key='ip', rate='10/m', block=False)
@ratelimit(key='user', rate='5/m', block=False)
def crear_pago(request):
    if getattr(request, 'limited', False):
        return Response({'error': 'Demasiadas solicitudes. Intenta en un minuto.'}, status=429)
    try:
        integrante = _get_integrante(request.user)
    except Exception:
        return Response({'error': 'Usuario sin integrante vinculado.'}, status=400)

    mensualidad_ids = request.data.get('mensualidades', [])
    if not mensualidad_ids:
        return Response({'error': 'Selecciona al menos una mensualidad.'}, status=400)

    ANIO_MAX = 2025
    mensualidades = Mensualidad.objects.filter(
        id__in=mensualidad_ids,
        integrante=integrante,
        estado='pendiente',
        anio__lte=ANIO_MAX,
    )
    if mensualidades.count() != len(mensualidad_ids):
        return Response(
            {'error': 'Algunas mensualidades no son válidas, ya están pagadas, o corresponden a un año no permitido.'},
            status=400,
        )

    monto_total = sum(int(m.monto) for m in mensualidades)
    orden_id = uuid.uuid4().hex

    pago = PagoOnline.objects.create(
        integrante=integrante,
        monto=monto_total,
        orden_id=orden_id,
        fecha_expiracion=timezone.now() + timedelta(minutes=15),
    )
    pago.mensualidades.set(mensualidades)

    descripcion = f'Team Mercenarios - {mensualidades.count()} cuota(s)'
    email = getattr(request.user, 'email', '') or 'pagos@mercenarios.cl'

    try:
        resultado = services.crear_pago(orden_id, monto_total, descripcion, email)
    except ValueError as exc:
        pago.delete()
        return Response({'error': str(exc)}, status=503)
    except Exception:
        pago.delete()
        return Response({'error': 'Error al conectar con Flow. Intenta más tarde.'}, status=503)

    pago.token_proveedor = resultado['token']
    pago.url_pago = resultado['url']
    pago.save()

    return Response({'orden_id': orden_id, 'url_pago': resultado['url']})


@api_view(['GET'])
@permission_classes([IsIntegrante])
def listar_pagos(request):
    try:
        integrante = _get_integrante(request.user)
    except Exception:
        return Response({'error': 'Usuario sin integrante vinculado.'}, status=400)

    pagos = PagoOnline.objects.filter(integrante=integrante).order_by('-fecha_creacion')[:50]
    return Response(PagoOnlineSerializer(pagos, many=True).data)


@api_view(['GET'])
@permission_classes([IsIntegrante])
def estado_pago(request, orden_id):
    try:
        integrante = _get_integrante(request.user)
    except Exception:
        return Response({'error': 'Usuario sin integrante vinculado.'}, status=400)

    try:
        pago = PagoOnline.objects.get(orden_id=orden_id, integrante=integrante)
    except PagoOnline.DoesNotExist:
        return Response({'error': 'Pago no encontrado.'}, status=404)

    if pago.estado == 'pendiente' and pago.fecha_expiracion < timezone.now():
        pago.estado = 'expirado'
        pago.save(update_fields=['estado'])

    return Response(PagoOnlineSerializer(pago).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirmar_pago_webhook(request):
    """
    Flow webhook endpoint (confirmURL).
    Flow sends POST with form data including 'token' and 's' (HMAC signature).
    Must respond 200 OK for Flow to consider it confirmed.
    """
    post_data = request.POST.dict() if request.POST else dict(request.data)

    if not services.verificar_firma_webhook(post_data):
        return HttpResponse('FIRMA_INVALIDA', status=400)

    token = post_data.get('token', '')
    if not token:
        return HttpResponse('TOKEN_REQUERIDO', status=400)

    # Verify actual payment status with Flow before touching DB
    try:
        estado_flow = services.verificar_pago(token)
    except Exception:
        return HttpResponse('ERROR_VERIFICACION', status=500)

    try:
        pago = PagoOnline.objects.get(token_proveedor=token)
    except PagoOnline.DoesNotExist:
        return HttpResponse('PAGO_NO_ENCONTRADO', status=404)

    if pago.estado == 'completado':
        return HttpResponse('OK')

    # Flow status 2 = cobrado exitosamente
    if estado_flow.get('status') != 2:
        PagoOnline.objects.filter(pk=pago.pk).update(
            estado='fallido',
            datos_respuesta=estado_flow,
        )
        return HttpResponse('OK')

    with transaction.atomic():
        pago_locked = PagoOnline.objects.select_for_update().get(pk=pago.pk)
        if pago_locked.estado == 'completado':
            return HttpResponse('OK')

        today = timezone.now().date()
        for mensualidad in pago_locked.mensualidades.filter(estado='pendiente'):
            mensualidad.estado = 'pagada'
            mensualidad.fecha_pago = today
            mensualidad.save()

        categoria, _ = Categoria.objects.get_or_create(
            nombre='Mensualidad online',
            defaults={'tipo': 'ingreso'},
        )
        movimiento = Movimiento.objects.create(
            tipo='ingreso',
            monto=pago_locked.monto,
            descripcion=f'Pago online Flow - Orden {pago_locked.orden_id}',
            categoria=categoria,
            fecha=today,
            integrante=pago_locked.integrante,
        )

        pago_locked.estado = 'completado'
        pago_locked.fecha_confirmacion = timezone.now()
        pago_locked.datos_respuesta = estado_flow
        pago_locked.movimiento = movimiento
        pago_locked.save()

    return HttpResponse('OK')


def mock_confirmar_pago(request, orden_id):
    """DEV ONLY — simulates Flow confirmation and redirects to return URL."""
    if not settings.DEBUG:
        return HttpResponseForbidden('Solo disponible en modo DEBUG.')

    try:
        pago = PagoOnline.objects.get(orden_id=orden_id)
    except PagoOnline.DoesNotExist:
        return HttpResponse('PAGO_NO_ENCONTRADO', status=404)

    if pago.estado != 'completado':
        today = timezone.now().date()
        with transaction.atomic():
            pago_locked = PagoOnline.objects.select_for_update().get(pk=pago.pk)
            if pago_locked.estado != 'completado':
                for mensualidad in pago_locked.mensualidades.filter(estado='pendiente'):
                    mensualidad.estado = 'pagada'
                    mensualidad.fecha_pago = today
                    mensualidad.save()

                categoria, _ = Categoria.objects.get_or_create(
                    nombre='Mensualidad online',
                    defaults={'tipo': 'ingreso'},
                )
                movimiento = Movimiento.objects.create(
                    tipo='ingreso',
                    monto=pago_locked.monto,
                    descripcion=f'Pago mock DEV - Orden {pago_locked.orden_id}',
                    categoria=categoria,
                    fecha=today,
                    integrante=pago_locked.integrante,
                )
                pago_locked.estado = 'completado'
                pago_locked.fecha_confirmacion = timezone.now()
                pago_locked.datos_respuesta = {'status': 2, 'mock': True}
                pago_locked.movimiento = movimiento
                pago_locked.save()

    return redirect(settings.FLOW_RETURN_URL)
