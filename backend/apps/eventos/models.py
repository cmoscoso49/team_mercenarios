from django.db import models


class Evento(models.Model):
    TIPO_CHOICES = [
        ('entrenamiento', 'Entrenamiento'),
        ('partida', 'Partida'),
        ('campeonato', 'Campeonato'),
        ('reunion', 'Reunión'),
        ('actividad', 'Actividad Interna'),
        ('externo', 'Evento Externo'),
    ]
    ESTADO_CHOICES = [
        ('programado', 'Programado'),
        ('realizado', 'Realizado'),
        ('cancelado', 'Cancelado'),
    ]

    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha = models.DateField()
    hora = models.TimeField(null=True, blank=True)
    lugar = models.CharField(max_length=200, blank=True)
    descripcion = models.TextField(blank=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='programado')
    imagen_destacada = models.ImageField(upload_to='eventos/imagenes/', null=True, blank=True)
    convocados = models.ManyToManyField(
        'integrantes.Integrante', related_name='convocatorias', blank=True
    )
    asistentes = models.ManyToManyField(
        'integrantes.Integrante', related_name='asistencias', blank=True
    )
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.titulo} ({self.fecha})"


class Participacion(models.Model):
    integrante = models.ForeignKey(
        'integrantes.Integrante', on_delete=models.CASCADE, related_name='participaciones'
    )
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='participaciones')
    asistio = models.BooleanField(default=True)
    observaciones = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Participación'
        verbose_name_plural = 'Participaciones'
        unique_together = [['integrante', 'evento']]
        ordering = ['-evento__fecha']

    def __str__(self):
        estado = 'Asistió' if self.asistio else 'No asistió'
        return f"{self.integrante} en {self.evento} - {estado}"
