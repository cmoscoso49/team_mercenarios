from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from apps.usuarios.permissions import CanAccessModulo, ROLES_FINANCIEROS

_PermDashboard = CanAccessModulo('dashboard')


@api_view(['GET'])
@permission_classes([_PermDashboard])
def dashboard(request):
    from apps.integrantes.models import Integrante
    from apps.finanzas.models import Movimiento, Deuda
    from apps.eventos.models import Evento
    from apps.noticias.models import Noticia
    from apps.eventos.serializers import EventoListSerializer
    from apps.noticias.serializers import NoticiaListSerializer
    from apps.finanzas.serializers import MovimientoSerializer

    now = timezone.now()
    mes = now.month
    anio = now.year

    total_ingresos = Movimiento.objects.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or 0
    total_egresos = Movimiento.objects.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or 0
    saldo_actual = total_ingresos - total_egresos

    from apps.finanzas.models import ConciliacionExcel
    conc = ConciliacionExcel.objects.order_by('-fecha_importacion').first()
    saldo_excel = conc.saldo_excel if conc else None

    ingresos_mes = Movimiento.objects.filter(
        tipo='ingreso', fecha__month=mes, fecha__year=anio
    ).aggregate(total=Sum('monto'))['total'] or 0

    egresos_mes = Movimiento.objects.filter(
        tipo='egreso', fecha__month=mes, fecha__year=anio
    ).aggregate(total=Sum('monto'))['total'] or 0

    deudas_total = Deuda.objects.filter(
        estado__in=['pendiente', 'parcial']
    ).aggregate(total=Sum('monto_total'))['total'] or 0

    integrantes_activos = Integrante.objects.filter(estado='activo').count()
    integrantes_inactivos = Integrante.objects.filter(estado='inactivo').count()

    proximos_eventos = Evento.objects.filter(
        fecha__gte=now.date(), estado='programado'
    ).order_by('fecha')[:5]

    ultimas_noticias = Noticia.objects.filter(estado='publicado').order_by('-fecha_creacion')[:3]

    es_financiero = getattr(request.user, 'rol', None) in ROLES_FINANCIEROS
    ultimos_movimientos_data = []
    if es_financiero:
        ultimos_movimientos = Movimiento.objects.select_related('categoria').order_by('-fecha', '-fecha_creacion')[:10]
        ultimos_movimientos_data = MovimientoSerializer(ultimos_movimientos, many=True).data

    # KPIs de cuotas 2024-2025: solo integrantes activos, solo años recientes
    from apps.finanzas.models import Mensualidad
    from django.db.models import Sum as DSum
    ANIO_MIN, ANIO_MAX = 2024, 2026
    integrantes_con_deuda = (
        Mensualidad.objects
        .filter(anio__gte=ANIO_MIN, anio__lte=ANIO_MAX, estado='pendiente',
                integrante__estado='activo')
        .values('integrante')
        .distinct()
        .count()
    )
    integrantes_al_dia = integrantes_activos - max(0, integrantes_con_deuda)
    deuda_mensualidades = (
        Mensualidad.objects
        .filter(anio__gte=ANIO_MIN, anio__lte=ANIO_MAX, estado='pendiente',
                integrante__estado='activo')
        .aggregate(t=DSum('monto'))['t'] or 0
    )

    respuesta = {
        'integrantes_activos': integrantes_activos,
        'integrantes_inactivos': integrantes_inactivos,
        'integrantes_al_dia': integrantes_al_dia,
        'integrantes_con_deuda': integrantes_con_deuda,
        'deuda_mensualidades': deuda_mensualidades,
        'proximos_eventos': EventoListSerializer(proximos_eventos, many=True).data,
        'ultimas_noticias': NoticiaListSerializer(ultimas_noticias, many=True).data,
        'tiene_acceso_financiero': es_financiero,
    }

    if es_financiero:
        respuesta.update({
            'saldo_actual': saldo_excel if saldo_excel is not None else saldo_actual,
            'saldo_sistema': saldo_actual,
            'saldo_excel': saldo_excel,
            'ingresos_mes': ingresos_mes,
            'egresos_mes': egresos_mes,
            'deudas_total': deudas_total,
            'ultimos_movimientos': ultimos_movimientos_data,
        })

    return Response(respuesta)
