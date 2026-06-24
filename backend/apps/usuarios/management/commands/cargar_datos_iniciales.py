from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Carga fixture initial_data.json solo si la BD está vacía (idempotente)'

    def handle(self, *args, **options):
        from apps.integrantes.models import Integrante
        if Integrante.objects.exists():
            self.stdout.write('BD ya tiene datos — omitiendo carga de fixture.')
            return
        self.stdout.write('BD vacía — cargando initial_data.json...')
        call_command('loaddata', 'fixtures/initial_data.json', verbosity=1)
        self.stdout.write(self.style.SUCCESS('Datos cargados correctamente.'))
