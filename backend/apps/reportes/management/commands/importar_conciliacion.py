"""
Lee las celdas exactas del Excel histórico y almacena la conciliación.
Uso: python manage.py importar_conciliacion
"""
import openpyxl
from django.core.management.base import BaseCommand

EXCEL_PATH = r"C:\Users\cmoscoso\OneDrive - INACAP\Descargas\2025\Mercenarios\datos team Actualizada 2022-2025 REVISADO POR ESTEBAN TL (4).xlsx"
EXCEL_TMP = r"C:\Users\cmoscoso\AppData\Local\Temp\mercenarios_tmp.xlsx"


class Command(BaseCommand):
    help = 'Lee celdas clave del Excel y almacena el saldo histórico real.'

    def handle(self, *args, **options):
        from apps.finanzas.models import ConciliacionExcel
        import shutil, os

        # Copiar si está bloqueado
        src = EXCEL_PATH
        try:
            wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
        except PermissionError:
            shutil.copy2(src, EXCEL_TMP)
            wb = openpyxl.load_workbook(EXCEL_TMP, read_only=True, data_only=True)

        def cell(sheet, ref):
            v = wb[sheet][ref].value
            if v is None:
                return 0
            try:
                return int(float(str(v)))
            except (ValueError, TypeError):
                return 0

        p16  = cell('H.CONTABLE', 'P16')   # saldo real — fuente de verdad
        p7   = cell('H.CONTABLE', 'P7')
        p10  = cell('H.CONTABLE', 'P10')
        g142 = cell('H.CONTABLE', 'G142')  # total gastos históricos
        l47  = cell('H.CONTABLE', 'L47')
        m23  = cell('MENSUALIDADES 2023', 'S34')
        rifa = cell('RIFA', 'N36')
        m24  = cell('MENSUALIDADES 2024', 'S41')
        m25  = cell('MENSUALIDADES 2025', 'S35')
        wb.close()

        conc = ConciliacionExcel.objects.create(
            origen_archivo=EXCEL_PATH,
            saldo_p16=p16,
            hcontable_caja_chica=p7,
            hcontable_donaciones=p10,
            hcontable_gastos=g142,
            hcontable_efectivo_extra=l47,
            mensualidades_2023=m23,
            rifa_total=rifa,
            mensualidades_2024=m24,
            mensualidades_2025=m25,
        )

        lines = [
            f'Conciliacion guardada (id={conc.id})',
            f'  P16 saldo real  : {p16}  (fuente de verdad)',
            f'  P7  caja+ms2022 : {p7}',
            f'  P10 donaciones  : {p10}',
            f'  G142 gastos     : -{g142}',
            f'  L47 extras      : {l47}',
            f'  M2023 S34       : {m23}',
            f'  RIFA N36        : {rifa}',
            f'  M2024 S41       : {m24}',
            f'  M2025 S35       : {m25}',
        ]
        self.stdout.write(self.style.SUCCESS('\n'.join(lines)))
