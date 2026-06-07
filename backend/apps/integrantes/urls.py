from rest_framework.routers import DefaultRouter
from .views import IntegranteViewSet

router = DefaultRouter()
router.register(r'', IntegranteViewSet, basename='integrante')

urlpatterns = router.urls
