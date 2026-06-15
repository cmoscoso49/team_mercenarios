from rest_framework import serializers
from .models import Usuario
from .permissions import get_modulos_acceso


class UsuarioSerializer(serializers.ModelSerializer):
    modulos_acceso = serializers.SerializerMethodField()

    def get_modulos_acceso(self, obj):
        rol = getattr(obj, 'rol', None)
        if not rol or rol == 'player':
            return []
        return get_modulos_acceso(rol)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'telefono', 'is_staff', 'modulos_acceso']
        read_only_fields = ['id', 'modulos_acceso']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'first_name', 'last_name', 'rol', 'telefono', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user
