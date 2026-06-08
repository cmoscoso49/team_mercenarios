from rest_framework.permissions import BasePermission

# Roles con acceso al panel de gestión (todos pagan cuotas y ven portal)
ROLES_LIDERAZGO  = {'admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero'}
ROLES_ADMIN      = {'admin'}
ROLES_TODOS      = {'admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero', 'player'}

# Alias semántico: todos los roles de liderazgo ven finanzas
ROLES_FINANCIEROS = ROLES_LIDERAZGO


class IsAdmin(BasePermission):
    """Solo admin (superusuario del sistema)."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_ADMIN
        )


class IsLiderazgo(BasePermission):
    """TL, Presidente, Vice, Secretario, Tesorero y Admin — acceso al panel de gestión."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_LIDERAZGO
        )


class IsIntegrante(BasePermission):
    """Cualquier usuario autenticado con rol válido — acceso al portal personal."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'rol', None) in ROLES_TODOS
        )


class IsPropioIntegranteOrAdmin(BasePermission):
    """Object-level: solo el propio integrante o admin."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'rol', None) in ROLES_ADMIN:
            return True
        try:
            return obj == request.user.integrante
        except Exception:
            return False


# ── Aliases de compatibilidad (apuntan a IsLiderazgo) ──────────────
IsAdminOrTesorero = IsLiderazgo
IsRolCompleto     = IsLiderazgo
IsCapitanOrAdmin  = IsLiderazgo
