from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crea usuarios para integrantes activos que no tienen cuenta (idempotente)'

    def handle(self, *args, **options):
        from apps.usuarios.models import Usuario
        from apps.integrantes.models import Integrante

        creados = 0
        for integrante in Integrante.objects.filter(estado='activo').select_related('usuario'):
            if integrante.usuario_id:
                continue

            nick = integrante.nick or integrante.nombre
            username = nick.lower().replace(' ', '_').replace('-', '_')

            # Si el username ya existe, agregamos sufijo
            base = username
            i = 2
            while Usuario.objects.filter(username=username).exists():
                username = f'{base}_{i}'
                i += 1

            user = Usuario.objects.create_user(
                username=username,
                password='Mercenarios2026!',
                rol='player',
            )
            integrante.usuario = user
            integrante.save(update_fields=['usuario'])
            self.stdout.write(f'  ✓ {integrante.nick} → usuario: {username}')
            creados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo — {creados} usuarios creados. Clave por defecto: Mercenarios2026!'
        ))
