from django.db import models
from django.conf import settings


class Integrante(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('pos_natal', 'Pos Natal'),
        ('postulante', 'Postulante'),
        ('suspendido', 'Suspendido'),
        ('honorario', 'Honorario'),
    ]
    ROL_CHOICES = [
        ('capitan', 'Capitán'),
        ('tesorero', 'Tesorero'),
        ('integrante', 'Integrante'),
        ('postulante', 'Postulante'),
        ('invitado', 'Invitado'),
    ]
    TALLA_CHOICES = [
        ('XS', 'XS'), ('S', 'S'), ('M', 'M'),
        ('L', 'L'), ('XL', 'XL'), ('XXL', 'XXL'),
    ]

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='integrante',
        verbose_name='Usuario del sistema',
    )
    nombre = models.CharField(max_length=150)
    rut = models.CharField(max_length=12, unique=True, blank=True, null=True)
    nick = models.CharField(max_length=50, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo')
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='integrante')
    talla_polera = models.CharField(max_length=5, choices=TALLA_CHOICES, blank=True)
    foto_perfil = models.ImageField(upload_to='integrantes/fotos/', null=True, blank=True)
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Integrante'
        verbose_name_plural = 'Integrantes'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.nick})" if self.nick else self.nombre
