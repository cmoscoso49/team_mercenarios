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

        # Garantizar que exista un usuario admin
        admin_user, admin_created = Usuario.objects.get_or_create(
            username='admin',
            defaults={'rol': 'admin', 'is_staff': True, 'is_superuser': True},
        )
        admin_user.set_password('Mercenarios2026!')
        admin_user.save(update_fields=['password'])
        accion = 'creado' if admin_created else 'clave reseteada'
        self.stdout.write(f'  ~ admin → {accion}')
        reseteados += 1

        # Resetear también otros usuarios de liderazgo sin integrante vinculado
        ROLES_LIDERAZGO = {'admin', 'TL', 'presidente', 'vice', 'secretario', 'tesorero'}
        ids_con_integrante = set(
            Integrante.objects.filter(usuario__isnull=False)
            .values_list('usuario_id', flat=True)
        )
        for user in Usuario.objects.filter(rol__in=ROLES_LIDERAZGO).exclude(
            id__in=ids_con_integrante
        ).exclude(username='admin'):
            user.set_password('Mercenarios2026!')
            user.save(update_fields=['password'])
            self.stdout.write(f'  ~ {user.username} (liderazgo) → clave reseteada')
            reseteados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo — {creados} creados, {reseteados} reseteados. Clave: Mercenarios2026!'
        ))
