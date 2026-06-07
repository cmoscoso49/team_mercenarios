from rest_framework.routers import DefaultRouter
from .views import EventoViewSet, ParticipacionViewSet

router = DefaultRouter()
router.register(r'', EventoViewSet, basename='evento')
router.register(r'participaciones', ParticipacionViewSet, basename='participacion')

urlpatterns = router.urls
