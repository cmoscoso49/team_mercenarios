from django.contrib import admin
from .models import Categoria, Movimiento, Mensualidad, Deuda, CuentaBanco, ImportacionArchivo, ConciliacionExcel, ConfiguracionCuota


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo']
    list_filter = ['tipo']


@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'tipo', 'monto', 'descripcion', 'categoria', 'es_caja_chica']
    list_filter = ['tipo', 'categoria', 'es_caja_chica', 'fecha']
    search_fields = ['descripcion', 'observaciones']
    ordering = ['-fecha']
    date_hierarchy = 'fecha'


@admin.register(Mensualidad)
class MensualidadAdmin(admin.ModelAdmin):
    list_display = ['integrante', 'anio', 'mes', 'monto', 'estado', 'fecha_pago']
    list_filter = ['anio', 'mes', 'estado']
    search_fields = ['integrante__nombre', 'integrante__nick']
    ordering = ['-anio', '-mes', 'integrante__nombre']


@admin.register(Deuda)
class DeudaAdmin(admin.ModelAdmin):
    list_display = ['integrante', 'descripcion', 'monto_total', 'monto_pagado', 'estado', 'fecha_origen']
    list_filter = ['estado']
    search_fields = ['integrante__nombre', 'descripcion']


@admin.register(CuentaBanco)
class CuentaBancoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'banco', 'saldo', 'activa']
    list_filter = ['activa', 'banco']


@admin.register(ImportacionArchivo)
class ImportacionArchivoAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'estado', 'registros_procesados', 'registros_con_error', 'fecha_importacion']
    list_filter = ['tipo', 'estado']
    readonly_fields = ['estado', 'mensaje', 'registros_procesados', 'registros_con_error', 'fecha_importacion']


@admin.register(ConciliacionExcel)
class ConciliacionExcelAdmin(admin.ModelAdmin):
    list_display = ['fecha_importacion', 'saldo_excel', 'origen_archivo']
    readonly_fields = ['fecha_importacion', 'saldo_excel']


@admin.register(ConfiguracionCuota)
class ConfiguracionCuotaAdmin(admin.ModelAdmin):
    list_display = ['valor_cuota', 'moneda', 'vigencia_desde', 'activa', 'fecha_creacion']
    list_filter = ['activa']
