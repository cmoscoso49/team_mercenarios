from rest_framework.routers import DefaultRouter
from .views import NoticiaViewSet

router = DefaultRouter()
router.register(r'', NoticiaViewSet, basename='noticia')

urlpatterns = router.urls
