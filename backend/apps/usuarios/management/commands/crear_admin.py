from django.core.management.base import BaseCommand, CommandError
from apps.usuarios.models import Usuario


class Command(BaseCommand):
    help = 'Crea o actualiza el usuario administrador con rol=admin, is_superuser=True'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin', help='Nombre de usuario (default: admin)')
        parser.add_argument('--password', help='Contraseña (requerida)')
        parser.add_argument('--email', default='', help='Email (opcional)')

    def handle(self, *args, **options):
        username = options['username']
        password = options.get('password')
        email = options.get('email', '')

        if not password:
            raise CommandError('Se requiere --password. Ejemplo: python manage.py crear_admin --password=CLAVE')

        user, created = Usuario.objects.get_or_create(username=username)
        user.set_password(password)
        user.rol = 'admin'
        user.is_staff = True
        user.is_superuser = True
        if email:
            user.email = email
        user.save()

        action = 'Creado' if created else 'Actualizado'
        self.stdout.write(self.style.SUCCESS(
            f'{action}: {username} → rol=admin | is_superuser=True | is_staff=True'
        ))
