from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Crea usuarios para integrantes activos que no tienen cuenta (idempotente)'

    def handle(self, *args, **options):
        from apps.usuarios.models import Usuario
        from apps.integrantes.models import Integrante

        reseteados = 0
        creados = 0

        for integrante in Integrante.objects.filter(estado='activo').select_related('usuario'):
            if integrante.usuario_id:
                # Resetear clave del usuario ya vinculado
                user = integrante.usuario
                user.set_password('Mercenarios2026!')
                user.save(update_fields=['password'])
                self.stdout.write(f'  ~ {integrante.nick} → clave reseteada: {user.username}')
                reseteados += 1
            else:
                nick = integrante.nick or integrante.nombre
                username = nick.lower().replace(' ', '_').replace('-', '_')
                existing = Usuario.objects.filter(username=username).first()
                if existing:
                    existing.set_password('Mercenarios2026!')
                    existing.save(update_fields=['password'])
                    integrante.usuario = existing
                    integrante.save(update_fields=['usuario'])
                    self.stdout.write(f'  ~ {integrante.nick} → vinculado: {username}')
                    reseteados += 1
                else:
                    user = Usuario.objects.create_user(
                        username=username, password='Mercenarios2026!', rol='player',
                    )
                    integrante.usuario = user
                    integrante.save(update_fields=['usuario'])
                    self.stdout.write(f'  ✓ {integrante.nick} → creado: {username}')
                    creados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo — {creados} creados, {reseteados} reseteados. Clave: Mercenarios2026!'
        ))
