from django.contrib import admin
from .models import Album, Foto, PublicacionInstagram


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'evento', 'total_fotos', 'fecha_creacion']
    search_fields = ['titulo', 'descripcion']


@admin.register(Foto)
class FotoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'album', 'destacada', 'fecha_subida']
    list_filter = ['album', 'destacada']
    filter_horizontal = ['integrantes_etiquetados']


@admin.register(PublicacionInstagram)
class PublicacionInstagramAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'estado', 'fecha_programada', 'fecha_creacion']
    list_filter = ['estado']
