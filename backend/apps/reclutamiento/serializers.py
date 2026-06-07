from rest_framework import serializers
from .models import Postulacion


class PostulacionPublicaSerializer(serializers.ModelSerializer):
    """Solo campos que el público puede enviar."""
    class Meta:
        model = Postulacion
        fields = [
            'nombre', 'edad', 'ciudad', 'telefono', 'email',
            'nick', 'experiencia', 'tiene_equipo', 'como_conocio', 'mensaje',
        ]

    def validate_edad(self, value):
        if value < 14 or value > 70:
            raise serializers.ValidationError("La edad debe estar entre 14 y 70 años.")
        return value


class PostulacionAdminSerializer(serializers.ModelSerializer):
    """Todos los campos para vista admin."""
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    como_conocio_display = serializers.CharField(source='get_como_conocio_display', read_only=True)

    class Meta:
        model = Postulacion
        fields = '__all__'
