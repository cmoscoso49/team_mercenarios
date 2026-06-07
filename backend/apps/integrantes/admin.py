from django.contrib import admin
from .models import Integrante


@admin.register(Integrante)
class IntegranteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nick', 'estado', 'rol', 'telefono', 'email', 'talla_polera', 'fecha_ingreso']
    list_filter = ['estado', 'rol', 'talla_polera']
    search_fields = ['nombre', 'nick', 'rut', 'email', 'telefono']
    ordering = ['nombre']
    fieldsets = (
        ('Datos Personales', {
            'fields': ('nombre', 'rut', 'nick', 'telefono', 'email', 'fecha_nacimiento', 'foto_perfil')
        }),
        ('Información del Team', {
            'fields': ('estado', 'rol', 'talla_polera', 'fecha_ingreso', 'observaciones')
        }),
    )
