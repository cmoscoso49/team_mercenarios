from django.contrib import admin
from .models import Integrante


@admin.register(Integrante)
class IntegranteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nick', 'estado', 'rol', 'usuario', 'telefono', 'email', 'fecha_ingreso']
    list_filter = ['estado', 'rol', 'talla_polera']
    search_fields = ['nombre', 'nick', 'rut', 'email', 'telefono']
    ordering = ['nombre']
    autocomplete_fields = ['usuario']
    fieldsets = (
        ('Cuenta de Sistema', {
            'fields': ('usuario',),
            'description': 'Vincular con un Usuario del sistema para habilitar el portal personal.',
        }),
        ('Datos Personales', {
            'fields': ('nombre', 'rut', 'nick', 'telefono', 'email', 'fecha_nacimiento', 'foto_perfil')
        }),
        ('Información del Team', {
            'fields': ('estado', 'rol', 'talla_polera', 'fecha_ingreso', 'observaciones')
        }),
    )
