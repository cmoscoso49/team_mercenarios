from django.db import models
from django.conf import settings


class Album(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    evento = models.ForeignKey(
        'eventos.Evento', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='albums'
    )
    portada = models.ImageField(upload_to='galeria/portadas/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Álbum'
        verbose_name_plural = 'Álbumes'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.titulo

    @property
    def total_fotos(self):
        return self.fotos.count()


class Foto(models.Model):
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='fotos')
    imagen = models.ImageField(upload_to='galeria/fotos/')
    titulo = models.CharField(max_length=200, blank=True)
    descripcion = models.TextField(blank=True)
    integrantes_etiquetados = models.ManyToManyField(
        'integrantes.Integrante', blank=True, related_name='fotos'
    )
    destacada = models.BooleanField(default=False)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Foto'
        verbose_name_plural = 'Fotos'
        ordering = ['-fecha_subida']

    def __str__(self):
        return self.titulo or f"Foto en {self.album}"


class PublicacionInstagram(models.Model):
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('lista', 'Lista para publicar'),
        ('publicada', 'Publicada'),
        ('error', 'Error'),
    ]

    titulo = models.CharField(max_length=200)
    texto = models.TextField()
    imagen = models.ImageField(upload_to='instagram/', null=True, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='borrador')
    destacado = models.BooleanField(default=False)
    fecha_programada = models.DateTimeField(null=True, blank=True)
    url_publicacion = models.URLField(blank=True)
    noticia_origen = models.ForeignKey(
        'noticias.Noticia', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='publicaciones_ig'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Publicación Instagram'
        verbose_name_plural = 'Publicaciones Instagram'
        ordering = ['-destacado', '-fecha_creacion']

    def __str__(self):
        return f"{self.titulo} ({self.get_estado_display()})"
