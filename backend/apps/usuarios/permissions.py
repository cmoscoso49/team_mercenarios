from rest_framework.permissions import BasePermission

ROLES_FINANCIEROS = {'administrador', 'tesorero'}
ROLES_ADMIN = {'administrador'}
ROLES_COMPLETOS = {'administrador', 'capitan', 'tesorero'}


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
