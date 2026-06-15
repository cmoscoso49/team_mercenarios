from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('admin',       'Administrador'),
        ('TL',          'Team Leader'),
        ('presidente',  'Presidente'),
        ('vice',        'Vice Presidente'),
        ('secretario',  'Secretario'),
        ('tesorero',    'Tesorero'),
        ('player',      'Player'),
    ]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='player')
    telefono = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        nombre = self.get_full_name()
        return f"{nombre} ({self.username})" if nombre else self.username


class PermisoModulo(models.Model):
    MODULOS = [
        ('dashboard',     'Dashboard'),
        ('integrantes',   'Integrantes'),
        ('finanzas',      'Finanzas'),
        ('reportes',      'Reportes'),
        ('eventos',       'Eventos'),
        ('noticias',      'Noticias'),
        ('instagram',     'Instagram / Galería'),
        ('reclutamiento', 'Reclutamiento'),
    ]
    ROLES = [
        ('admin',      'Administrador'),
        ('TL',         'Team Leader'),
        ('presidente', 'Presidente'),
        ('vice',       'Vice Presidente'),
        ('secretario', 'Secretario'),
        ('tesorero',   'Tesorero'),
    ]

    modulo      = models.CharField(max_length=30, choices=MODULOS)
    rol         = models.CharField(max_length=20, choices=ROLES)
    puede_ver   = models.BooleanField(default=False)
    puede_editar = models.BooleanField(default=False)

    class Meta:
        unique_together = ('modulo', 'rol')
        verbose_name = 'Permiso de módulo'
        verbose_name_plural = 'Permisos de módulo'
        ordering = ['modulo', 'rol']

    def __str__(self):
        return f'{self.modulo} / {self.rol}'
