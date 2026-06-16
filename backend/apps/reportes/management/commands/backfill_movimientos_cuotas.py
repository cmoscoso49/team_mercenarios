"""
Crea Movimientos de ingreso para mensualidades marcadas como 'pagada'
que no tienen un Movimiento correspondiente (cuotas marcadas antes del
fix que auto-crea el Movimiento en perform_update).

Solo aplica a mensualidades DESPUÉS de la última conciliación Excel,
ya que las anteriores ya están incluidas en el saldo P16.

Uso:
  python manage.py backfill_movimientos_cuotas          # modo real
  python manage.py backfill_movimientos_cuotas --dry-run
  python manage.py backfill_movimientos_cuotas --anio 2026
"""
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Backfill Movimientos de ingreso para cuotas pagadas sin movimiento.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Solo muestra, no crea')
        parser.add_argument('--anio', type=int, default=None, help='Filtrar por año (default: desde conciliacion)')

    def handle(self, *args, **options):
        from apps.finanzas.models import ConciliacionExcel, Mensualidad, Movimiento

        dry = options['dry_run']
        anio_filtro = options.get('anio')

        conc = ConciliacionExcel.objects.order_by('-fecha_importacion').first()
        if not conc:
            self.stdout.write(self.style.ERROR('No hay conciliacion Excel en BD. Corre importar_conciliacion primero.'))
            return

        corte = conc.fecha_importacion.date()
        self.stdout.write(f'Fecha de corte conciliacion: {corte}')

        # Mensualidades pagadas que podrían no estar en el saldo Excel
        qs = Mensualidad.objects.select_related('integrante').filter(estado='pagada')
        if anio_filtro:
            qs = qs.filter(anio=anio_filtro)
        else:
            # Solo tomar las del año de corte o posteriores para no duplicar históricas
            qs = qs.filter(anio__gte=corte.year)

        creados = 0
        saltados = 0

        for m in qs:
            descripcion = f'Cuota {m.get_mes_display()} {m.anio} — {m.integrante}'
            # Verificar si ya existe un Movimiento con esa descripción exacta
            existe = Movimiento.objects.filter(
                tipo='ingreso',
                integrante=m.integrante,
                descripcion=descripcion,
            ).exists()
            if existe:
                saltados += 1
                continue

            fecha_mov = m.fecha_pago or corte
            if dry:
                self.stdout.write(
                    f'  [dry-run] Crear: {descripcion} | ${m.monto} | fecha {fecha_mov}'
                )
            else:
                Movimiento.objects.create(
                    tipo='ingreso',
                    monto=m.monto,
                    descripcion=descripcion,
                    fecha=fecha_mov,
                    integrante=m.integrante,
                )
                self.stdout.write(self.style.SUCCESS(f'  Creado: {descripcion} | ${m.monto}'))
            creados += 1

        modo = '[DRY-RUN] ' if dry else ''
        self.stdout.write(self.style.SUCCESS(
            f'\n{modo}Total: {creados} movimientos {"a crear" if dry else "creados"}, {saltados} ya existian.'
        ))
