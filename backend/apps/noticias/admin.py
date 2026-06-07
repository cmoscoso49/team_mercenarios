from django.contrib import admin
from .models import Noticia


@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'estado', 'visibilidad', 'destacada', 'autor', 'fecha_publicacion']
    list_filter = ['estado', 'visibilidad', 'destacada']
    search_fields = ['titulo', 'resumen', 'contenido']
    ordering = ['-fecha_creacion']
