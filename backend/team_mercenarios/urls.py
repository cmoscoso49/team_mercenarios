from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from apps.usuarios.views import LoginView, MeView
from apps.reportes.views_public import (
    public_stats, public_eventos, public_noticias,
    public_noticia_detail, public_evento_detail, public_instagram,
)
from apps.reclutamiento.views import postulacion_publica
from apps.integrantes.views_portal import (
    portal_me, portal_mis_cuotas, portal_mis_eventos,
    portal_confirmar_asistencia, portal_cambiar_password,
)

urlpatterns = [
    path('api/v1/public/stats/',              public_stats),
    path('api/v1/public/eventos/',            public_eventos),
    path('api/v1/public/eventos/<int:pk>/',   public_evento_detail),
    path('api/v1/public/noticias/',           public_noticias),
    path('api/v1/public/noticias/<int:pk>/',  public_noticia_detail),
    path('api/v1/public/postulacion/',        postulacion_publica),
    path('api/v1/public/instagram/',          public_instagram),
    path('admin/', admin.site.urls),
    path('api/v1/auth/login/', LoginView.as_view(), name='login'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/me/', MeView.as_view(), name='me'),
    path('api/v1/integrantes/', include('apps.integrantes.urls')),
    path('api/v1/finanzas/', include('apps.finanzas.urls')),
    path('api/v1/eventos/', include('apps.eventos.urls')),
    path('api/v1/noticias/', include('apps.noticias.urls')),
    path('api/v1/galeria/', include('apps.galeria.urls')),
    path('api/v1/reportes/', include('apps.reportes.urls')),
    path('api/v1/dashboard/', include('apps.reportes.urls_dashboard')),
    path('api/v1/importacion/', include('apps.finanzas.urls_importacion')),
    path('api/v1/reclutamiento/', include('apps.reclutamiento.urls')),
    path('api/v1/portal/me/',          portal_me),
    path('api/v1/portal/mis-cuotas/',  portal_mis_cuotas),
    path('api/v1/portal/mis-eventos/', portal_mis_eventos),
    path('api/v1/portal/eventos/<int:evento_id>/confirmar/', portal_confirmar_asistencia),
    path('api/v1/portal/cambiar-password/',                 portal_cambiar_password),
    path('api/v1/', include('apps.pagos.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
