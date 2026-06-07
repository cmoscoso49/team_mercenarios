from rest_framework import serializers
from .models import Integrante


class IntegranteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integrante
        fields = ['id', 'nombre', 'nick', 'estado', 'rol', 'telefono', 'email', 'talla_polera', 'foto_perfil']


class IntegranteSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = Integrante
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']
