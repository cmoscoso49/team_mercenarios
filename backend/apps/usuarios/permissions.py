from rest_framework.permissions import BasePermission

ROLES_FINANCIEROS   = {'administrador', 'tesorero'}
ROLES_ADMIN         = {'administrador'}
ROLES_COMPLETOS     = {'administrador', 'capitan', 'tesorero'}
ROLES_CAPITAN_ADMIN = {'administrador', 'capitan'}
ROLES_AUTENTICADOS  = {'administrador', 'tesorero', 'capitan', 'integrante', 'readonly'}


class IsAdminOrTesorero(BasePermission):
    """Solo administrador y tesorero pueden ver info financiera."""
    message = 'No tienes permisos para ver la informacion financiera del Team.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_FINANCIEROS
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_ADMIN
        )


class IsCapitanOrAdmin(BasePermission):
    """Capitán y administrador pueden gestionar eventos, noticias y participaciones."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_CAPITAN_ADMIN
        )


class IsIntegrante(BasePermission):
    """Cualquier usuario autenticado con rol válido puede acceder al portal."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_AUTENTICADOS
        )


class IsPropioIntegranteOrAdmin(BasePermission):
    """Object-level: solo el propio integrante o administrador."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'rol', None) in ROLES_ADMIN:
            return True
        try:
            return obj == request.user.integrante
        except Exception:
            return False
