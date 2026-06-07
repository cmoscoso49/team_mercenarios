from django.urls import path
from .views import reporte_financiero, reporte_integrantes, reporte_participaciones, reporte_conciliacion

urlpatterns = [
    path('financiero/', reporte_financiero, name='reporte-financiero'),
    path('integrantes/', reporte_integrantes, name='reporte-integrantes'),
    path('participaciones/', reporte_participaciones, name='reporte-participaciones'),
    path('conciliacion/', reporte_conciliacion, name='reporte-conciliacion'),
]
