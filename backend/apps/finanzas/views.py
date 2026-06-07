from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum
from django.utils import timezone
from apps.usuarios.permissions import IsAdminOrTesorero
from .models import Categoria, Movimiento, Mensualidad, Deuda, CuentaBanco, ImportacionArchivo, ConciliacionExcel, ConfiguracionCuota
from .serializers import (
    CategoriaSerializer, MovimientoSerializer, MensualidadSerializer,
    DeudaSerializer, CuentaBancoSerializer, ImportacionArchivoSerializer,
)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo']


class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = Movimiento.objects.select_related('categoria', 'integrante').all()
    serializer_class = MovimientoSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'categoria', 'es_caja_chica', 'integrante']
    search_fields = ['descripcion', 'observaciones']
    ordering_fields = ['fecha', 'monto', 'tipo']
    ordering = ['-fecha']

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


class MensualidadViewSet(viewsets.ModelViewSet):
    queryset = Mensualidad.objects.select_related('integrante').all()
    serializer_class = MensualidadSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['integrante', 'anio', 'mes', 'estado']
    ordering_fields = ['anio', 'mes', 'integrante__nombre']
    ordering = ['-anio', '-mes']


class DeudaViewSet(viewsets.ModelViewSet):
    queryset = Deuda.objects.select_related('integrante').all()
    serializer_class = DeudaSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['integrante', 'estado']
    search_fields = ['descripcion']
    ordering_fields = ['fecha_origen', 'monto_total']
    ordering = ['-fecha_origen']


class CuentaBancoViewSet(viewsets.ModelViewSet):
    queryset = CuentaBanco.objects.all()
    serializer_class = CuentaBancoSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activa']


class ConfiguracionCuotaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionCuota.objects.all()
    permission_classes = [IsAdminOrTesorero]

    def get_serializer_class(self):
        from .serializers import ConfiguracionCuotaSerializer
        return ConfiguracionCuotaSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


@api_view(['GET'])
@permission_classes([IsAdminOrTesorero])
def resumen_financiero(request):
    now = timezone.now()
    mes_actual = now.month
    anio_actual = now.year

    total_ingresos = Movimiento.objects.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or 0
    total_egresos = Movimiento.objects.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or 0
    saldo = total_ingresos - total_egresos

    ingresos_mes = Movimiento.objects.filter(
        tipo='ingreso', fecha__month=mes_actual, fecha__year=anio_actual
    ).aggregate(total=Sum('monto'))['total'] or 0

    egresos_mes = Movimiento.objects.filter(
        tipo='egreso', fecha__month=mes_actual, fecha__year=anio_actual
    ).aggregate(total=Sum('monto'))['total'] or 0

    deudas_total = Deuda.objects.filter(
        estado__in=['pendiente', 'parcial']
    ).aggregate(total=Sum('monto_total'))['total'] or 0

    # Saldo real desde Excel (si existe conciliación importada)
    conc = ConciliacionExcel.objects.order_by('-fecha_importacion').first()
    saldo_excel = conc.saldo_excel if conc else None
    diferencia = (saldo_excel - saldo) if saldo_excel is not None else None

    return Response({
        'saldo': saldo,
        'saldo_excel': saldo_excel,
        'diferencia_excel_sistema': diferencia,
        'ingresos_mes': ingresos_mes,
        'egresos_mes': egresos_mes,
        'deudas_total': deudas_total,
        'total_ingresos_historico': total_ingresos,
        'total_egresos_historico': total_egresos,
    })
