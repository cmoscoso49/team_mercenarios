from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_financiero(request):
    from apps.finanzas.models import Movimiento, Mensualidad, Deuda, Categoria
    from apps.finanzas.serializers import MovimientoSerializer

    anio = int(request.GET.get('anio', 2025))

    ingresos_por_mes = []
    egresos_por_mes = []
    for mes in range(1, 13):
        ing = Movimiento.objects.filter(tipo='ingreso', fecha__year=anio, fecha__month=mes).aggregate(
            total=Sum('monto'))['total'] or 0
        eg = Movimiento.objects.filter(tipo='egreso', fecha__year=anio, fecha__month=mes).aggregate(
            total=Sum('monto'))['total'] or 0
        ingresos_por_mes.append({'mes': mes, 'total': ing})
        egresos_por_mes.append({'mes': mes, 'total': eg})

    gastos_por_categoria = list(
        Movimiento.objects.filter(tipo='egreso', fecha__year=anio)
        .values('categoria__nombre')
        .annotate(total=Sum('monto'))
        .order_by('-total')
    )

    mensualidades_pendientes = Mensualidad.objects.filter(
        anio=anio, estado='pendiente'
    ).select_related('integrante').values(
        'integrante__nombre', 'integrante__nick', 'mes'
    ).order_by('integrante__nombre', 'mes')

    deudas_resumen = Deuda.objects.filter(estado__in=['pendiente', 'parcial']).aggregate(
        total=Sum('monto_total'), pagado=Sum('monto_pagado')
    )

    return Response({
        'anio': anio,
        'ingresos_por_mes': ingresos_por_mes,
        'egresos_por_mes': egresos_por_mes,
        'gastos_por_categoria': gastos_por_categoria,
        'mensualidades_pendientes': list(mensualidades_pendientes),
        'deudas_total': deudas_resumen.get('total') or 0,
        'deudas_pagado': deudas_resumen.get('pagado') or 0,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_integrantes(request):
    from apps.integrantes.models import Integrante
    from apps.finanzas.models import Mensualidad, Deuda
    from apps.eventos.models import Participacion

    anio = int(request.GET.get('anio', 2025))

    integrantes = Integrante.objects.all()
    resultado = []

    for integrante in integrantes:
        pagadas = Mensualidad.objects.filter(integrante=integrante, anio=anio, estado='pagada').count()
        total_meses = 12
        deuda = Deuda.objects.filter(
            integrante=integrante, estado__in=['pendiente', 'parcial']
        ).aggregate(total=Sum('monto_total'))['total'] or 0
        participaciones = Participacion.objects.filter(integrante=integrante, asistio=True).count()

        resultado.append({
            'id': integrante.id,
            'nombre': integrante.nombre,
            'nick': integrante.nick,
            'estado': integrante.estado,
            'rol': integrante.rol,
            'mensualidades_pagadas': pagadas,
            'mensualidades_pendientes': total_meses - pagadas,
            'deuda_total': deuda,
            'total_participaciones': participaciones,
        })

    resultado.sort(key=lambda x: x['nombre'])

    return Response({
        'anio': anio,
        'integrantes': resultado,
        'total_activos': Integrante.objects.filter(estado='activo').count(),
        'total_inactivos': Integrante.objects.filter(estado='inactivo').count(),
        'total_postulantes': Integrante.objects.filter(estado='postulante').count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_participaciones(request):
    from apps.integrantes.models import Integrante
    from apps.eventos.models import Evento, Participacion

    anio = int(request.GET.get('anio', timezone.now().year))

    eventos = Evento.objects.filter(fecha__year=anio, estado='realizado')
    total_eventos = eventos.count()

    integrantes = Integrante.objects.filter(estado='activo')
    resultado = []

    for integrante in integrantes:
        asistencias = Participacion.objects.filter(
            integrante=integrante, evento__fecha__year=anio, asistio=True
        ).count()
        porcentaje = round((asistencias / total_eventos * 100), 1) if total_eventos > 0 else 0

        resultado.append({
            'id': integrante.id,
            'nombre': integrante.nombre,
            'nick': integrante.nick,
            'asistencias': asistencias,
            'total_eventos': total_eventos,
            'porcentaje_asistencia': porcentaje,
        })

    resultado.sort(key=lambda x: x['asistencias'], reverse=True)

    return Response({
        'anio': anio,
        'total_eventos_realizados': total_eventos,
        'participaciones': resultado,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reporte_conciliacion(request):
    from apps.finanzas.models import Movimiento, ConciliacionExcel

    total_ingresos = Movimiento.objects.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or 0
    total_egresos = Movimiento.objects.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or 0
    saldo_sistema = total_ingresos - total_egresos

    conc = ConciliacionExcel.objects.order_by('-fecha_importacion').first()

    if not conc:
        return Response({
            'saldo_sistema': saldo_sistema,
            'saldo_excel': None,
            'diferencia': None,
            'estado': 'sin_conciliacion',
            'detalle_excel': None,
        })

    saldo_excel = conc.saldo_excel
    diferencia = saldo_excel - saldo_sistema
    estado = 'cuadrado' if abs(diferencia) < 1 else 'diferencia_detectada'

    return Response({
        'saldo_sistema': saldo_sistema,
        'saldo_excel': saldo_excel,
        'diferencia': diferencia,
        'estado': estado,
        'total_ingresos_sistema': total_ingresos,
        'total_egresos_sistema': total_egresos,
        'detalle_excel': {
            'hcontable_caja_chica_ms2022': conc.hcontable_caja_chica,
            'hcontable_donaciones': conc.hcontable_donaciones,
            'hcontable_gastos': conc.hcontable_gastos,
            'hcontable_extras': conc.hcontable_efectivo_extra,
            'mensualidades_2023': conc.mensualidades_2023,
            'rifa': conc.rifa_total,
            'mensualidades_2024': conc.mensualidades_2024,
            'mensualidades_2025': conc.mensualidades_2025,
            'formula': 'P7+P10-P13+L47+M2023.S34+RIFA.N36+M2024.S41+M2025.S35',
            'fecha_importacion': conc.fecha_importacion,
        },
    })
