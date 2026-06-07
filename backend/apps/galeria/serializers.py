from rest_framework import serializers
from .models import Album, Foto, PublicacionInstagram


class FotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Foto
        fields = '__all__'
        read_only_fields = ['fecha_subida']


class AlbumListSerializer(serializers.ModelSerializer):
    total_fotos = serializers.ReadOnlyField()
    evento_titulo = serializers.CharField(source='evento.titulo', read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'titulo', 'descripcion', 'portada', 'evento_titulo', 'total_fotos', 'fecha_creacion']


class AlbumSerializer(serializers.ModelSerializer):
    fotos = FotoSerializer(many=True, read_only=True)
    total_fotos = serializers.ReadOnlyField()

    class Meta:
        model = Album
        fields = '__all__'
        read_only_fields = ['fecha_creacion']


class PublicacionInstagramSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = PublicacionInstagram
        fields = '__all__'
        read_only_fields = ['fecha_creacion']
