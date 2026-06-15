from django.core.management.base import BaseCommand
from apps.integrantes.models import Integrante
from apps.usuarios.models import Usuario

ROLES_TARGET = ['presidente', 'vice', 'secretario', 'TL']
PASSWORD_DEFAULT = 'mercenarios2026@'


class Command(BaseCommand):
    help = 'Crea acceso al sistema para presidente, vice, secretario y TL usando su nick como usuario'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Muestra lo que haría sin guardar')
        parser.add_argument('--password', default=PASSWORD_DEFAULT, help='Contraseña (default: mercenarios2026@)')

    def handle(self, *args, **options):
        dry_run  = options['dry_run']
        password = options['password']

        integrantes = (
            Integrante.objects
            .filter(rol__in=ROLES_TARGET, estado='activo')
            .order_by('rol', 'nombre')
        )

        if not integrantes.exists():
            self.stdout.write(self.style.WARNING('No se encontraron integrantes activos con esos roles.'))
            return

        for integrante in integrantes:
            nick = (integrante.nick or '').strip()
            if not nick:
                self.stdout.write(
                    self.style.WARNING(f'  [SKIP] {integrante.nombre} ({integrante.rol}) — sin nick registrado')
                )
                continue

            username = nick.lower().replace(' ', '_')

            if dry_run:
                ya_tiene = integrante.usuario is not None
                self.stdout.write(
                    f'  [DRY] {integrante.rol:<12} | nick={nick:<20} | '
                    f'usuario={username:<20} | '
                    f'{"ya vinculado: " + integrante.usuario.username if ya_tiene else "CREAR"}'
                )
                continue

            # Crear o recuperar el Usuario
            user, created = Usuario.objects.get_or_create(
                username=username,
                defaults={
                    'rol':        integrante.rol,
                    'first_name': integrante.nombre.split()[0] if integrante.nombre else '',
                    'last_name':  ' '.join(integrante.nombre.split()[1:]) if integrante.nombre else '',
                    'email':      integrante.email or '',
                    'telefono':   integrante.telefono or '',
                },
            )

            if created:
                user.set_password(password)
                user.save()
                accion = 'CREADO'
            else:
                # Si ya existe, asegurarse de que el rol sea el correcto
                if user.rol != integrante.rol:
                    user.rol = integrante.rol
                    user.save(update_fields=['rol'])
                accion = 'YA EXISTIA (rol actualizado)'

            # Vincular integrante <-> usuario
            if integrante.usuario != user:
                integrante.usuario = user
                integrante.save(update_fields=['usuario'])

            self.stdout.write(
                self.style.SUCCESS(
                    f'  [{accion}] {integrante.rol:<12} | {integrante.nombre:<30} | '
                    f'usuario={username} | nick={nick}'
                )
            )

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'\nListo. Clave para todos: {password}'
            ))
