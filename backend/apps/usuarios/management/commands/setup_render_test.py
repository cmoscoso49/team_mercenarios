from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Crea usuario y datos de prueba en Render (idempotente)'

    def handle(self, *args, **options):
        from apps.usuarios.models import Usuario
        from apps.integrantes.models import Integrante
        from apps.finanzas.models import Mensualidad, ConfiguracionCuota

        # Usuario
        user, created = Usuario.objects.get_or_create(
            username='missed',
            defaults={'rol': 'tesorero', 'email': 'missed@mercenarios.cl'},
        )
        if created or not user.check_password('2422Sup+@'):
            user.set_password('2422Sup+@')
            user.rol = 'tesorero'
            user.save()
            self.stdout.write('Usuario missed creado/actualizado')

        # Integrante
        integrante, _ = Integrante.objects.get_or_create(
            nick='missed',
            defaults={
                'nombre': 'Missed',
                'estado': 'activo',
                'rol': 'secretario',
                'usuario': user,
            },
        )
        if integrante.usuario != user:
            integrante.usuario = user
            integrante.save()

        # Monto cuota
        config_qs = ConfiguracionCuota.objects.order_by('-id').first()
        monto = config_qs.valor if config_qs else 5000

        # Mensualidades 2026
        anio = timezone.now().year
        creadas = 0
        for mes in range(1, 13):
            _, c = Mensualidad.objects.get_or_create(
                integrante=integrante,
                anio=anio,
                mes=mes,
                defaults={'monto': monto, 'estado': 'pendiente'},
            )
            if c:
                creadas += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Setup OK — integrante: {integrante.nick}, mensualidades creadas: {creadas}'
            )
        )
