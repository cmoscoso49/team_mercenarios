from rest_framework.routers import DefaultRouter
from .views import AlbumViewSet, FotoViewSet, PublicacionInstagramViewSet

router = DefaultRouter()
router.register(r'albums', AlbumViewSet, basename='album')
router.register(r'fotos', FotoViewSet, basename='foto')
router.register(r'instagram', PublicacionInstagramViewSet, basename='instagram')

urlpatterns = router.urls
