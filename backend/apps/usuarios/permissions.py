from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.core.cache import cache

ROLES_LIDERAZGO  = {'admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero'}
ROLES_ADMIN      = {'admin'}
ROLES_TODOS      = {'admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero', 'player'}
ROLES_FINANCIEROS = ROLES_LIDERAZGO

_CACHE_KEY = 'permisos_modulo_v1'
_CACHE_TTL = 900  # 15 minutos


def _get_permisos_cache():
    """Retorna dict {(modulo, rol): (puede_ver, puede_editar)} desde cache o BD."""
    datos = cache.get(_CACHE_KEY)
    if datos is not None:
        return datos
    from .models import PermisoModulo
    datos = {(p.modulo, p.rol): (p.puede_ver, p.puede_editar)
             for p in PermisoModulo.objects.all()}
    cache.set(_CACHE_KEY, datos, _CACHE_TTL)
    return datos


def invalidar_cache_permisos():
    cache.delete(_CACHE_KEY)


def _puede_ver(rol, modulo):
    if rol == 'admin':
        return True
    return _get_permisos_cache().get((modulo, rol), (False, False))[0]


def _puede_editar(rol, modulo):
    if rol == 'admin':
        return True
    return _get_permisos_cache().get((modulo, rol), (False, False))[1]


def get_modulos_acceso(rol):
    """Lista de módulos visibles para un rol."""
    from .models import PermisoModulo
    if rol == 'admin':
        return [m for m, _ in PermisoModulo.MODULOS]
    permisos = _get_permisos_cache()
    return [m for m, _ in PermisoModulo.MODULOS
            if permisos.get((m, rol), (False, False))[0]]


# ── Permission class estática ──────────────────────────────────────────────────

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_ADMIN
        )


class IsLiderazgo(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_LIDERAZGO
        )


class IsIntegrante(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_TODOS
        )


class IsPropioIntegranteOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'rol', None) in ROLES_ADMIN:
            return True
        try:
            return obj == request.user.integrante
        except Exception:
            return False


# ── Factory dinámica por módulo ────────────────────────────────────────────────

def CanAccessModulo(modulo):
    """Retorna una clase Permission que verifica BD para el módulo dado."""
    class _Perm(BasePermission):
        _mod = modulo

        def has_permission(self, request, view):
            user = request.user
            if not (user and user.is_authenticated):
                return False
            rol = getattr(user, 'rol', None)
            if not rol or rol == 'player':
                return False
            if rol == 'admin':
                return True
            if request.method in SAFE_METHODS:
                return _puede_ver(rol, self._mod)
            return _puede_editar(rol, self._mod)

    _Perm.__name__ = f'CanAccess_{modulo}'
    return _Perm


# ── Aliases de compatibilidad ──────────────────────────────────────────────────
IsAdminOrTesorero = IsLiderazgo
IsRolCompleto     = IsLiderazgo
IsCapitanOrAdmin  = IsLiderazgo
