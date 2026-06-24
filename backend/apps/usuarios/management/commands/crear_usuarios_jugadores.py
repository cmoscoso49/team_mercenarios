from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crea usuarios para integrantes activos que no tienen cuenta (idempotente)'

    def handle(self, *args, **options):
        from apps.usuarios.models import Usuario
        from apps.integrantes.models import Integrante

        creados = 0
        vinculados = 0
        for integrante in Integrante.objects.filter(estado='activo').select_related('usuario'):
            if integrante.usuario_id:
                continue

            nick = integrante.nick or integrante.nombre
            username = nick.lower().replace(' ', '_').replace('-', '_')

            # Si ya existe un usuario con ese nick, vincularlo y resetear clave
            existing = Usuario.objects.filter(username=username).first()
            if existing:
                existing.set_password('Mercenarios2026!')
                existing.rol = 'player'
                existing.save(update_fields=['password', 'rol'])
                integrante.usuario = existing
                integrante.save(update_fields=['usuario'])
                self.stdout.write(f'  ~ {integrante.nick} → vinculado a usuario existente: {username}')
                vinculados += 1
            else:
                user = Usuario.objects.create_user(
                    username=username,
                    password='Mercenarios2026!',
                    rol='player',
                )
                integrante.usuario = user
                integrante.save(update_fields=['usuario'])
                self.stdout.write(f'  ✓ {integrante.nick} → usuario creado: {username}')
                creados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo — {creados} creados, {vinculados} vinculados. Clave: Mercenarios2026!'
        ))
