from django.contrib import admin
from .models import PagoOnline


@admin.register(PagoOnline)
class PagoOnlineAdmin(admin.ModelAdmin):
    list_display = ['orden_id', 'integrante', 'monto', 'estado', 'proveedor', 'fecha_creacion', 'fecha_confirmacion']
    list_filter = ['estado', 'proveedor']
    search_fields = ['orden_id', 'integrante__nombre', 'integrante__nick']
    readonly_fields = ['orden_id', 'token_proveedor', 'datos_respuesta', 'fecha_creacion', 'fecha_confirmacion', 'url_pago']
    ordering = ['-fecha_creacion']
