from django.contrib import admin
from .models import Postulacion


@admin.register(Postulacion)
class PostulacionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nick', 'ciudad', 'edad', 'estado', 'fecha_envio']
    list_filter = ['estado', 'tiene_equipo', 'como_conocio']
    search_fields = ['nombre', 'nick', 'ciudad', 'email', 'telefono']
    readonly_fields = ['fecha_envio']
    ordering = ['-fecha_envio']
    fieldsets = (
        ('Postulante', {
            'fields': ('nombre', 'nick', 'edad', 'ciudad', 'telefono', 'email')
        }),
        ('Experiencia', {
            'fields': ('experiencia', 'tiene_equipo', 'como_conocio', 'mensaje')
        }),
        ('Gestión', {
            'fields': ('estado', 'notas_admin', 'fecha_envio')
        }),
    )
