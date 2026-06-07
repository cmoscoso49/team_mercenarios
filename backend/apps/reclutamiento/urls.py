from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import postulacion_publica, PostulacionViewSet

router = DefaultRouter()
router.register(r'postulaciones', PostulacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
