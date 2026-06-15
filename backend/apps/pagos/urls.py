from django.conf import settings
from django.urls import path
from . import views

urlpatterns = [
    path('portal/pagos/crear/',                  views.crear_pago),
    path('portal/pagos/',                        views.listar_pagos),
    path('portal/pagos/<str:orden_id>/estado/',  views.estado_pago),
    path('public/pagos/confirmar/',              views.confirmar_pago_webhook),
]

if settings.DEBUG:
    urlpatterns += [
        path('dev/pagos/mock/<str:orden_id>/', views.mock_confirmar_pago),
    ]
