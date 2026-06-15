from django.core.management.base import BaseCommand
from apps.integrantes.models import Integrante
from apps.finanzas.models import Mensualidad, ConfiguracionCuota


# Integrantes que ingresaron en 2026 — solo pagan desde el mes siguiente a su ingreso
# IDs de producción (PythonAnywhere)
INGRESO_2026 = {
    63: (6, 2026),  # Spectro  — ingreso jun, paga desde jul
    60: (5, 2026),  # Shadow   — ingreso may, paga desde jun
    64: (4, 2026),  # Indio    — ingreso abr, paga desde may
    59: (5, 2026),  # Corvo    — ingreso may, paga desde jun
}


class Command(BaseCommand):
    help = 'Genera mensualidades 2026 para todos los integrantes activos'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Solo muestra sin guardar')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        valor = int(ConfiguracionCuota.valor_vigente())
        activos = Integrante.objects.filter(estado='activo')

        creadas = 0
        exentas = 0
        existentes = 0

        for integrante in activos:
            # Mes desde el que este integrante empieza a pagar en 2026
            if integrante.id in INGRESO_2026:
                mes_ingreso, _ = INGRESO_2026[integrante.id]
                primer_mes_pago = mes_ingreso + 1  # mes siguiente al ingreso
            else:
                primer_mes_pago = 1  # todos pagan desde enero

            for mes in range(1, 13):
                if mes < primer_mes_pago:
                    estado_nuevo = 'exento'
                else:
                    estado_nuevo = 'pendiente'

                if dry_run:
                    self.stdout.write(
                        f'  [{integrante.nick or integrante.nombre}] 2026-{mes:02d} = {estado_nuevo}'
                    )
                    if estado_nuevo == 'exento':
                        exentas += 1
                    else:
                        creadas += 1
                else:
                    obj, created = Mensualidad.objects.get_or_create(
                        integrante=integrante,
                        anio=2026,
                        mes=mes,
                        defaults={'monto': valor, 'estado': estado_nuevo},
                    )
                    if created:
                        if estado_nuevo == 'exento':
                            exentas += 1
                        else:
                            creadas += 1
                    else:
                        existentes += 1

        prefijo = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'{prefijo}Mensualidades pendientes creadas: {creadas} | '
            f'exentas (ingreso 2026): {exentas} | '
            f'ya existían: {existentes}'
        ))
