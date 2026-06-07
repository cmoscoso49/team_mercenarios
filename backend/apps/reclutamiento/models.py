from django.db import models


class Postulacion(models.Model):
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('revisando',  'En revisión'),
        ('en_prueba',  'Partida de prueba'),
        ('aprobada',   'Aprobada'),
        ('rechazada',  'Rechazada'),
    ]

    COMO_CONOCIO_CHOICES = [
        ('instagram',    'Instagram'),
        ('facebook',     'Facebook'),
        ('amigo',        'Un amigo o conocido'),
        ('evento',       'En un evento de Airsoft'),
        ('internet',     'Búsqueda en internet'),
        ('otro',         'Otro'),
    ]

    nombre       = models.CharField(max_length=100)
    edad         = models.PositiveSmallIntegerField()
    ciudad       = models.CharField(max_length=80)
    telefono     = models.CharField(max_length=20)
    email        = models.EmailField()
    nick         = models.CharField(max_length=60, blank=True)
    experiencia  = models.TextField(blank=True)
    tiene_equipo = models.BooleanField(default=False)
    como_conocio = models.CharField(max_length=20, choices=COMO_CONOCIO_CHOICES, blank=True)
    mensaje      = models.TextField(blank=True)
    estado       = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    notas_admin  = models.TextField(blank=True)
    fecha_envio  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Postulación'
        verbose_name_plural = 'Postulaciones'
        ordering = ['-fecha_envio']

    def __str__(self):
        return f"{self.nombre} ({self.nick or 'sin nick'}) — {self.get_estado_display()}"
