from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UsuarioSerializer
from .permissions import IsAdmin, invalidar_cache_permisos


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Usuario y contraseña requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Credenciales incorrectas'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Usuario inactivo'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UsuarioSerializer(user).data,
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)

    def put(self, request):
        serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAdmin])
def permisos_view(request):
    """
    GET  → retorna la matriz completa de permisos por módulo y rol.
    PUT  → actualiza uno o más permisos. Body: [{modulo, rol, puede_ver, puede_editar}, ...]
    """
    from .models import PermisoModulo

    if request.method == 'GET':
        modulos = [m for m, _ in PermisoModulo.MODULOS]
        roles   = [r for r, _ in PermisoModulo.ROLES if r != 'admin']
        permisos_db = {(p.modulo, p.rol): p for p in PermisoModulo.objects.all()}

        resultado = []
        for modulo, modulo_label in PermisoModulo.MODULOS:
            fila = {'modulo': modulo, 'label': modulo_label, 'roles': {}}
            for rol, rol_label in PermisoModulo.ROLES:
                if rol == 'admin':
                    fila['roles'][rol] = {'puede_ver': True, 'puede_editar': True, 'bloqueado': True}
                else:
                    p = permisos_db.get((modulo, rol))
                    fila['roles'][rol] = {
                        'puede_ver':    p.puede_ver    if p else False,
                        'puede_editar': p.puede_editar if p else False,
                        'bloqueado': False,
                    }
            resultado.append(fila)
        return Response({'permisos': resultado, 'roles': [{'rol': r, 'label': l} for r, l in PermisoModulo.ROLES]})

    # PUT
    cambios = request.data if isinstance(request.data, list) else request.data.get('cambios', [])
    if not cambios:
        return Response({'detail': 'Sin cambios.'}, status=status.HTTP_400_BAD_REQUEST)

    actualizados = 0
    for item in cambios:
        modulo      = item.get('modulo')
        rol         = item.get('rol')
        puede_ver   = bool(item.get('puede_ver', False))
        puede_editar = bool(item.get('puede_editar', False))
        if not modulo or not rol or rol == 'admin':
            continue
        PermisoModulo.objects.update_or_create(
            modulo=modulo, rol=rol,
            defaults={'puede_ver': puede_ver, 'puede_editar': puede_editar},
        )
        actualizados += 1

    invalidar_cache_permisos()
    return Response({'detail': f'{actualizados} permiso(s) actualizado(s).'})
