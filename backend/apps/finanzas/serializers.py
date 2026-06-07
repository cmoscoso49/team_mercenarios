from rest_framework import serializers
from .models import Categoria, Movimiento, Mensualidad, Deuda, CuentaBanco, ImportacionArchivo, ConfiguracionCuota


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class MovimientoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    integrante_nombre = serializers.CharField(source='integrante.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Movimiento
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'creado_por']


class MensualidadSerializer(serializers.ModelSerializer):
    integrante_nombre = serializers.CharField(source='integrante.nombre', read_only=True)
    mes_display = serializers.CharField(source='get_mes_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Mensualidad
        fields = '__all__'


class DeudaSerializer(serializers.ModelSerializer):
    integrante_nombre = serializers.CharField(source='integrante.nombre', read_only=True)
    monto_pendiente = serializers.ReadOnlyField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Deuda
        fields = '__all__'


class CuentaBancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaBanco
        fields = '__all__'


class ConfiguracionCuotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionCuota
        fields = '__all__'
        read_only_fields = ['creado_por', 'fecha_creacion']


class ImportacionArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportacionArchivo
        fields = '__all__'
        read_only_fields = ['estado', 'mensaje', 'registros_procesados', 'registros_con_error',
                            'fecha_importacion', 'importado_por']
