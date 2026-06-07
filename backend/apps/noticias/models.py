from django.db import models
from django.conf import settings


class Noticia(models.Model):
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('publicado', 'Publicado'),
        ('archivado', 'Archivado'),
    ]
    VISIBILIDAD_CHOICES = [
        ('publica', 'Pública'),
        ('privada', 'Privada'),
        ('integrantes', 'Solo Integrantes'),
    ]

    titulo = models.CharField(max_length=200)
    resumen = models.TextField(blank=True)
    contenido = models.TextField()
    imagen = models.ImageField(upload_to='noticias/imagenes/', null=True, blank=True)
    fecha_publicacion = models.DateField(auto_now_add=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='borrador')
    visibilidad = models.CharField(max_length=15, choices=VISIBILIDAD_CHOICES, default='integrantes')
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    destacada = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Noticia'
        verbose_name_plural = 'Noticias'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.titulo
