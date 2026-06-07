from rest_framework import serializers
from .models import Evento, Participacion


class EventoListSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total_asistentes = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = ['id', 'titulo', 'tipo', 'tipo_display', 'fecha', 'hora', 'lugar',
                  'estado', 'estado_display', 'imagen_destacada', 'total_asistentes']

    def get_total_asistentes(self, obj):
        return obj.asistentes.count()


class EventoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Evento
        fields = '__all__'
        read_only_fields = ['fecha_creacion']


class ParticipacionSerializer(serializers.ModelSerializer):
    integrante_nombre = serializers.CharField(source='integrante.nombre', read_only=True)
    integrante_nick = serializers.CharField(source='integrante.nick', read_only=True)
    evento_titulo = serializers.CharField(source='evento.titulo', read_only=True)
    evento_fecha = serializers.DateField(source='evento.fecha', read_only=True)

    class Meta:
        model = Participacion
        fields = '__all__'
        read_only_fields = ['fecha_registro']
