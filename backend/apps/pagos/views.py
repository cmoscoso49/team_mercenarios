import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
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

    ANIO_MAX = 2026
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


def _procesar_pago_si_completado(pago, estado_flow):
    """Procesa el pago si Flow confirma status=2. Idempotente via select_for_update."""
    if estado_flow.get('status') != 2:
        PagoOnline.objects.filter(pk=pago.pk).update(
            estado='fallido',
            datos_respuesta=estado_flow,
        )
        return

    with transaction.atomic():
        pago_locked = PagoOnline.objects.select_for_update().get(pk=pago.pk)
        if pago_locked.estado == 'completado':
            return

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


@csrf_exempt
def pago_retorno_html(request):
    """
    FLOW_RETURN_URL handler — browser lands here after completing payment on Flow.
    Flow redirects via POST; token may be in POST or GET params.
    Also confirms the payment directly with Flow API as backup if webhook failed.
    Serves a standalone dark-themed HTML page with the payment result.
    """
    token = request.POST.get('token', '') or request.GET.get('token', '')
    portal_url = getattr(settings, 'FLOW_PORTAL_URL', 'http://127.0.0.1:5173/portal')

    try:
        pago = PagoOnline.objects.get(token_proveedor=token)
    except PagoOnline.DoesNotExist:
        estado = 'no_encontrado'
        monto = 0
        mensualidades = []
        orden_id_display = token[:12] + '...' if token else '—'
    else:
        # Si el pago aún está pendiente, verificar con Flow directamente (backup del webhook)
        if pago.estado == 'pendiente':
            try:
                estado_flow = services.verificar_pago(token)
                _procesar_pago_si_completado(pago, estado_flow)
                pago.refresh_from_db()
            except Exception:
                pass

        estado = pago.estado
        monto = pago.monto
        orden_id_display = pago.orden_id[:16] + '...'
        mensualidades = list(pago.mensualidades.all())

    MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    if estado == 'completado':
        icono = '✓'
        titulo = 'Pago Confirmado'
        color_titulo = '#52a852'
        color_borde = '#3d7a3d'
        detalle_items = ''.join(
            f'<li>{MESES[m.mes]} {m.anio}</li>'
            for m in mensualidades
        )
        detalle_html = f'<ul class="cuotas">{detalle_items}</ul>' if mensualidades else ''
        monto_html = f'<p class="monto">Total pagado: <strong>${monto:,}</strong> CLP</p>'
    elif estado == 'pendiente':
        icono = '⏳'
        titulo = 'Procesando Pago…'
        color_titulo = '#f0a500'
        color_borde = '#a07000'
        detalle_html = '<p style="color:#aaa">Espera unos segundos, el pago está siendo confirmado.</p>'
        monto_html = ''
    elif estado == 'fallido':
        icono = '✕'
        titulo = 'Pago No Completado'
        color_titulo = '#cc2222'
        color_borde = '#881111'
        detalle_html = '<p style="color:#aaa">El pago fue rechazado o cancelado. Puedes intentarlo nuevamente.</p>'
        monto_html = ''
    else:
        icono = '?'
        titulo = 'Estado Desconocido'
        color_titulo = '#888'
        color_borde = '#444'
        detalle_html = '<p style="color:#aaa">No se pudo determinar el estado del pago.</p>'
        monto_html = ''

    refresh_meta = f'<meta http-equiv="refresh" content="4;url=/pago-retorno/?token={token}">' if estado == 'pendiente' else ''

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  {refresh_meta}
  <title>Resultado de Pago — Team Mercenarios</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Rajdhani:wght@400;500;600&display=swap');
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #080808;
      color: #e8e8e8;
      font-family: 'Rajdhani', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .card {{
      background: #131313;
      border: 1px solid {color_borde};
      border-top: 3px solid {color_titulo};
      padding: 2.5rem 3rem;
      max-width: 480px;
      width: 90%;
      text-align: center;
    }}
    .icono {{
      font-size: 3.5rem;
      color: {color_titulo};
      margin-bottom: .75rem;
    }}
    .titulo {{
      font-family: 'Oswald', sans-serif;
      font-size: 1.9rem;
      font-weight: 700;
      color: {color_titulo};
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 1.25rem;
    }}
    .orden {{ color: #666; font-size: .85rem; margin-bottom: 1.25rem; }}
    .monto {{ font-size: 1.2rem; margin-bottom: 1rem; }}
    .monto strong {{ color: {color_titulo}; }}
    .cuotas {{
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      justify-content: center;
      margin-bottom: 1.25rem;
    }}
    .cuotas li {{
      background: #1e1e1e;
      border: 1px solid #333;
      padding: .2rem .7rem;
      font-size: .9rem;
      color: #ccc;
    }}
    .btn {{
      display: inline-block;
      margin-top: 1.5rem;
      padding: .75rem 2rem;
      background: #cc2222;
      color: #fff;
      text-decoration: none;
      font-family: 'Oswald', sans-serif;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }}
    .btn:hover {{ background: #aa1a1a; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icono">{icono}</div>
    <div class="titulo">{titulo}</div>
    <p class="orden">Orden: {orden_id_display}</p>
    {monto_html}
    {detalle_html}
    <a class="btn" href="{portal_url}/mis-cuotas">Ver mis cuotas</a>
  </div>
</body>
</html>"""

    return HttpResponse(html, content_type='text/html; charset=utf-8')


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
