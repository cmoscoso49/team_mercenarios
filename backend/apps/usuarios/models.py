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
