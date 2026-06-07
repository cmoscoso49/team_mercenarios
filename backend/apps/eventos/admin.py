from django.contrib import admin
from .models import Evento, Participacion


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha', 'hora', 'lugar', 'estado']
    list_filter = ['tipo', 'estado', 'fecha']
    search_fields = ['titulo', 'lugar', 'descripcion']
    filter_horizontal = ['convocados', 'asistentes']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']


@admin.register(Participacion)
class ParticipacionAdmin(admin.ModelAdmin):
    list_display = ['integrante', 'evento', 'asistio', 'fecha_registro']
    list_filter = ['asistio', 'evento__tipo']
    search_fields = ['integrante__nombre', 'integrante__nick', 'evento__titulo']
