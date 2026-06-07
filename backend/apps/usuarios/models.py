from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('administrador', 'Administrador'),
        ('tesorero', 'Tesorero'),
        ('capitan', 'Capitán'),
        ('integrante', 'Integrante'),
        ('readonly', 'Solo Lectura'),
    ]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='integrante')
    telefono = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        nombre = self.get_full_name()
        return f"{nombre} ({self.username})" if nombre else self.username
