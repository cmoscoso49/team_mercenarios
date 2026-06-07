from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CategoriaViewSet, MovimientoViewSet, MensualidadViewSet,
    DeudaViewSet, CuentaBancoViewSet, ConfiguracionCuotaViewSet, resumen_financiero,
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'movimientos', MovimientoViewSet, basename='movimiento')
router.register(r'mensualidades', MensualidadViewSet, basename='mensualidad')
router.register(r'deudas', DeudaViewSet, basename='deuda')
router.register(r'cuentas', CuentaBancoViewSet, basename='cuenta')
router.register(r'configuracion-cuota', ConfiguracionCuotaViewSet, basename='configuracion-cuota')

urlpatterns = router.urls + [
    path('resumen/', resumen_financiero, name='resumen-financiero'),
]
