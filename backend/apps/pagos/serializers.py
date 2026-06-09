from rest_framework import serializers
from .models import PagoOnline


class PagoOnlineSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    integrante_nombre = serializers.CharField(source='integrante.nombre', read_only=True)
    mensualidades_detalle = serializers.SerializerMethodField()

    class Meta:
        model = PagoOnline
        fields = [
            'id', 'orden_id', 'monto', 'proveedor', 'estado', 'estado_display',
            'url_pago', 'fecha_creacion', 'fecha_expiracion', 'fecha_confirmacion',
            'integrante_nombre', 'mensualidades_detalle',
        ]
        read_only_fields = fields

    def get_mensualidades_detalle(self, obj):
        return [
            {'id': m.id, 'anio': m.anio, 'mes': m.mes, 'monto': str(m.monto)}
            for m in obj.mensualidades.all()
        ]
