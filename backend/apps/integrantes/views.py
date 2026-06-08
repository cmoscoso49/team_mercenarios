from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.usuarios.permissions import IsAdmin, IsRolCompleto, IsCapitanOrAdmin
from .models import Integrante
from .serializers import IntegranteSerializer, IntegranteListSerializer


class IntegranteViewSet(viewsets.ModelViewSet):
    queryset = Integrante.objects.all()
    serializer_class = IntegranteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'rol', 'talla_polera']
    search_fields = ['nombre', 'nick', 'rut', 'email']
    ordering_fields = ['nombre', 'fecha_ingreso', 'estado']
    ordering = ['nombre']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsRolCompleto()]
        if self.request.method == 'PATCH':
            return [IsCapitanOrAdmin()]
        return [IsAdmin()]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'No se puede eliminar un integrante. Usa "Dar de baja" para marcarlo como inactivo.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return IntegranteListSerializer
        return IntegranteSerializer

    @action(detail=True, methods=['patch'], url_path='dar-de-baja')
    def dar_de_baja(self, request, pk=None):
        integrante = self.get_object()
        if integrante.estado == 'inactivo':
            return Response({'detail': 'El integrante ya está inactivo.'}, status=status.HTTP_400_BAD_REQUEST)
        integrante.estado = 'inactivo'
        integrante.save(update_fields=['estado', 'fecha_actualizacion'])
        return Response({'detail': f'{integrante.nombre} fue dado de baja correctamente.', 'estado': 'inactivo'})

    @action(detail=True, methods=['patch'], url_path='reactivar')
    def reactivar(self, request, pk=None):
        integrante = self.get_object()
        if integrante.estado == 'activo':
            return Response({'detail': 'El integrante ya está activo.'}, status=status.HTTP_400_BAD_REQUEST)
        integrante.estado = 'activo'
        integrante.save(update_fields=['estado', 'fecha_actualizacion'])
        return Response({'detail': f'{integrante.nombre} fue reactivado correctamente.', 'estado': 'activo'})

    @action(detail=True, methods=['get'])
    def mensualidades(self, request, pk=None):
        from apps.finanzas.models import Mensualidad
        from apps.finanzas.serializers import MensualidadSerializer
        integrante = self.get_object()
        mensualidades = Mensualidad.objects.filter(integrante=integrante).order_by('-anio', '-mes')
        serializer = MensualidadSerializer(mensualidades, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def participaciones(self, request, pk=None):
        from apps.eventos.models import Participacion
        from apps.eventos.serializers import ParticipacionSerializer
        integrante = self.get_object()
        participaciones = Participacion.objects.filter(integrante=integrante).order_by('-evento__fecha')
        serializer = ParticipacionSerializer(participaciones, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def deudas(self, request, pk=None):
        from apps.finanzas.models import Deuda
        from apps.finanzas.serializers import DeudaSerializer
        integrante = self.get_object()
        deudas = Deuda.objects.filter(integrante=integrante).order_by('-fecha_origen')
        serializer = DeudaSerializer(deudas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def resumen(self, request, pk=None):
        from apps.finanzas.models import Mensualidad, Deuda
        from apps.eventos.models import Participacion
        from django.db.models import Sum, Count
        integrante = self.get_object()
        anio_actual = __import__('datetime').date.today().year

        mensualidades_pagadas = Mensualidad.objects.filter(
            integrante=integrante, anio=anio_actual, estado='pagada'
        ).count()
        total_participaciones = Participacion.objects.filter(integrante=integrante, asistio=True).count()
        deudas_pendientes = Deuda.objects.filter(
            integrante=integrante, estado__in=['pendiente', 'parcial']
        ).aggregate(total=Sum('monto_total'))['total'] or 0

        return Response({
            'mensualidades_pagadas_anio': mensualidades_pagadas,
            'total_participaciones': total_participaciones,
            'deudas_pendientes': deudas_pendientes,
        })

    @action(detail=True, methods=['get'])
    def reincorporacion(self, request, pk=None):
        from apps.finanzas.models import Mensualidad, ConfiguracionCuota
        from django.utils import timezone
        import math

        integrante = self.get_object()
        hoy = timezone.now().date()

        ultima_pagada = (
            Mensualidad.objects
            .filter(integrante=integrante, estado='pagada')
            .order_by('-anio', '-mes')
            .first()
        )

        valor_cuota = int(ConfiguracionCuota.valor_vigente())

        if not ultima_pagada:
            cuotas_pendientes = 0
            ultimo_pago_str = None
            desde_anio, desde_mes = hoy.year, hoy.month
        else:
            ultimo_pago_str = f'{ultima_pagada.anio}-{ultima_pagada.mes:02d}'
            desde_anio = ultima_pagada.anio
            desde_mes = ultima_pagada.mes + 1
            if desde_mes > 12:
                desde_mes = 1
                desde_anio += 1
            meses_transcurridos = (hoy.year - desde_anio) * 12 + (hoy.month - desde_mes) + 1
            cuotas_pendientes = max(0, meses_transcurridos)

        monto_total = cuotas_pendientes * valor_cuota

        return Response({
            'integrante_id': integrante.id,
            'nombre': integrante.nombre,
            'nick': integrante.nick,
            'estado_actual': integrante.estado,
            'ultimo_pago_registrado': ultimo_pago_str,
            'cuotas_pendientes': cuotas_pendientes,
            'valor_cuota_actual': valor_cuota,
            'monto_total_reincorporacion': monto_total,
            'puede_reincorporarse': integrante.estado in ('inactivo', 'suspendido'),
            'observaciones': (
                'Sin pagos previos registrados.' if not ultima_pagada
                else f'Ultima mensualidad pagada: {ultimo_pago_str}. '
                     f'{cuotas_pendientes} cuotas pendientes hasta {hoy.year}-{hoy.month:02d}.'
            ),
        })
