from rest_framework import serializers
from .models import Noticia


class NoticiaListSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.get_full_name', read_only=True)

    class Meta:
        model = Noticia
        fields = ['id', 'titulo', 'resumen', 'imagen', 'estado', 'visibilidad',
                  'destacada', 'fecha_publicacion', 'autor_nombre']


class NoticiaSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    visibilidad_display = serializers.CharField(source='get_visibilidad_display', read_only=True)

    class Meta:
        model = Noticia
        fields = '__all__'
        read_only_fields = ['fecha_publicacion', 'fecha_creacion', 'fecha_actualizacion', 'autor']
