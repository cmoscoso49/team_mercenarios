from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Carga fixture initial_data.json solo si la BD está vacía (idempotente)'

    def handle(self, *args, **options):
        from apps.integrantes.models import Integrante
        count = Integrante.objects.count()
        if count >= 10:
            self.stdout.write(f'BD ya tiene datos reales ({count} integrantes) — omitiendo carga.')
            return
        if count > 0:
            self.stdout.write(f'BD tiene {count} integrante(s) de prueba — limpiando para cargar datos reales...')
            call_command('flush', '--no-input', verbosity=0)
        self.stdout.write('Cargando initial_data.json...')
        call_command('loaddata', 'fixtures/initial_data.json', verbosity=1)
        self.stdout.write(self.style.SUCCESS('Datos reales cargados correctamente.'))
