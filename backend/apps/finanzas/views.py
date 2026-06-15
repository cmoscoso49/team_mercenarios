import io
import csv
import hashlib
from datetime import datetime, date
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from apps.usuarios.permissions import IsAdminOrTesorero
from .models import Categoria, Movimiento, Mensualidad, Deuda, CuentaBanco, ImportacionArchivo, ConciliacionExcel, ConfiguracionCuota, ExtractoMovimiento
from .serializers import (
    CategoriaSerializer, MovimientoSerializer, MensualidadSerializer,
    DeudaSerializer, CuentaBancoSerializer, ImportacionArchivoSerializer,
    ExtractoMovimientoSerializer,
)


# ─────────────────────────────────────────────────────────────────────────────
# Parser extracto COOPEUCH — PDF, Excel, CSV, texto pegado
# ─────────────────────────────────────────────────────────────────────────────

def _limpiar_numero(v):
    if v is None:
        return None
    s = str(v).strip().replace('\xa0', '').replace('−', '-')
    negativo = s.startswith('-')
    s = s.replace('.', '').replace(',', '').replace('$', '').replace(' ', '').replace('-', '').replace('+', '')
    if not s:
        return None
    try:
        n = int(float(s))
        return -n if negativo else n
    except (ValueError, TypeError):
        return None


def _limpiar_fecha(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = str(v).strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y', '%d/%m/%y'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _fila_desde_monto(monto_val, cargo_val, abono_val):
    """
    COOPEUCH usa columna única 'Monto': positivo=abono, negativo=cargo.
    Otros bancos usan columnas separadas Cargo/Abono.
    Retorna (cargo, abono) como enteros positivos.
    """
    if monto_val is not None:
        n = _limpiar_numero(monto_val)
        if n is None:
            return None, None
        if n < 0:
            return abs(n), None   # cargo
        return None, abs(n)       # abono
    c = _limpiar_numero(cargo_val)
    a = _limpiar_numero(abono_val)
    return (abs(c) if c else None), (abs(a) if a else None)


def _detectar_header(all_rows):
    """Encuentra la fila de encabezado y devuelve (header_idx, header_map)."""
    for i, row in enumerate(all_rows):
        row_str = [str(c).lower().strip() if c is not None else '' for c in row]
        if any('fecha' in c for c in row_str):
            hmap = {}
            for j, c in enumerate(row_str):
                if 'fecha' in c and 'fecha' not in hmap:
                    hmap['fecha'] = j
                elif any(k in c for k in ('descripci', 'glosa', 'concepto', 'movimiento')):
                    hmap['descripcion'] = j
                elif 'monto' in c and 'cargo' not in hmap and 'abono' not in hmap:
                    hmap['monto'] = j   # COOPEUCH: columna única
                elif any(k in c for k in ('cargo', 'debe', 'egreso', 'retiro', 'giro')):
                    hmap['cargo'] = j
                elif any(k in c for k in ('abono', 'haber', 'ingreso', 'depósito', 'deposito')):
                    hmap['abono'] = j
                elif 'saldo' in c:
                    hmap['saldo'] = j
            if 'fecha' in hmap:
                return i, hmap
    return None, {}


def _construir_filas(all_rows, header_idx, hmap):
    filas = []
    for row in all_rows[header_idx + 1:]:
        if not any(c for c in row if c is not None and str(c).strip()):
            continue

        def _g(key):
            idx = hmap.get(key)
            return row[idx] if idx is not None and idx < len(row) else None

        fecha = _limpiar_fecha(_g('fecha'))
        if not fecha:
            continue

        descripcion = str(_g('descripcion') or '').strip()[:500]
        cargo, abono = _fila_desde_monto(_g('monto'), _g('cargo'), _g('abono'))
        saldo_raw = _limpiar_numero(_g('saldo'))
        saldo = abs(saldo_raw) if saldo_raw is not None else None

        if cargo is None and abono is None:
            continue

        h = hashlib.sha256(
            f"{fecha}|{descripcion}|{cargo}|{abono}|{saldo}".encode()
        ).hexdigest()

        filas.append({
            'fecha': fecha,
            'descripcion': descripcion,
            'cargo': cargo,
            'abono': abono,
            'saldo': saldo,
            'referencia_hash': h,
        })
    return filas


def _parsear_pdf(contenido_bytes):
    """Extrae tabla de un PDF de COOPEUCH usando pdfplumber."""
    import pdfplumber
    all_rows = []
    with pdfplumber.open(io.BytesIO(contenido_bytes)) as pdf:
        for page in pdf.pages:
            tabla = page.extract_table()
            if tabla:
                all_rows.extend(tabla)
    if not all_rows:
        raise ValueError("No se encontró tabla en el PDF. Asegúrate de que el PDF tiene texto seleccionable (no es una imagen).")
    return all_rows


def _parsear_texto(texto):
    """
    Parsea texto pegado desde el navegador (copia de tabla HTML).
    Detecta separación por tabulaciones o múltiples espacios.
    """
    lineas = [l for l in texto.splitlines() if l.strip()]
    if not lineas:
        raise ValueError("El texto pegado está vacío.")
    # Determina separador: tab o espacios múltiples
    tiene_tab = any('\t' in l for l in lineas)
    rows = []
    for l in lineas:
        if tiene_tab:
            rows.append(l.split('\t'))
        else:
            import re
            rows.append(re.split(r'\s{2,}', l.strip()))
    return rows


def _parsear_extracto(contenido_bytes, filename):
    """
    Punto de entrada del parser. Soporta:
    - PDF de COOPEUCH (.pdf)  — columna única Monto
    - Excel (.xlsx/.xls)
    - CSV (.csv)
    - Texto pegado del navegador (filename='paste.txt')
    """
    ext = filename.lower().rsplit('.', 1)[-1]

    if ext == 'pdf':
        all_rows = _parsear_pdf(contenido_bytes)

    elif ext in ('xlsx', 'xls', 'xlsm'):
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(contenido_bytes), read_only=True, data_only=True)
        ws = wb.active
        all_rows = [list(r) for r in ws.iter_rows(values_only=True)]
        wb.close()

    elif ext in ('txt', 'tsv'):
        try:
            texto = contenido_bytes.decode('utf-8')
        except Exception:
            texto = contenido_bytes.decode('latin-1', errors='replace')
        all_rows = _parsear_texto(texto)

    else:  # csv y cualquier otro
        try:
            texto = contenido_bytes.decode('latin-1')
        except Exception:
            texto = contenido_bytes.decode('utf-8', errors='replace')
        delim = ';' if texto.count(';') > texto.count(',') else ','
        all_rows = [list(r) for r in csv.reader(io.StringIO(texto), delimiter=delim)]

    header_idx, hmap = _detectar_header(all_rows)
    if header_idx is None:
        raise ValueError(
            "No se encontró encabezado con columna 'Fecha'. "
            "Columnas reconocidas: Fecha, Descripción, Monto (o Cargo/Abono), Saldo."
        )

    return _construir_filas(all_rows, header_idx, hmap)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo']


class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = Movimiento.objects.select_related('categoria', 'integrante').all()
    serializer_class = MovimientoSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tipo', 'categoria', 'es_caja_chica', 'integrante']
    search_fields = ['descripcion', 'observaciones']
    ordering_fields = ['fecha', 'monto', 'tipo']
    ordering = ['-fecha']

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


class MensualidadViewSet(viewsets.ModelViewSet):
    queryset = Mensualidad.objects.select_related('integrante').all()
    serializer_class = MensualidadSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['integrante', 'anio', 'mes', 'estado']
    ordering_fields = ['anio', 'mes', 'integrante__nombre']
    ordering = ['-anio', '-mes']


class DeudaViewSet(viewsets.ModelViewSet):
    queryset = Deuda.objects.select_related('integrante').all()
    serializer_class = DeudaSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['integrante', 'estado']
    search_fields = ['descripcion']
    ordering_fields = ['fecha_origen', 'monto_total']
    ordering = ['-fecha_origen']


class CuentaBancoViewSet(viewsets.ModelViewSet):
    queryset = CuentaBanco.objects.all()
    serializer_class = CuentaBancoSerializer
    permission_classes = [IsAdminOrTesorero]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activa']


class ConfiguracionCuotaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionCuota.objects.all()
    permission_classes = [IsAdminOrTesorero]

    def get_serializer_class(self):
        from .serializers import ConfiguracionCuotaSerializer
        return ConfiguracionCuotaSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


@api_view(['GET'])
@permission_classes([IsAdminOrTesorero])
def resumen_financiero(request):
    now = timezone.now()
    mes_actual = now.month
    anio_actual = now.year

    total_ingresos = Movimiento.objects.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or 0
    total_egresos = Movimiento.objects.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or 0
    saldo = total_ingresos - total_egresos

    ingresos_mes = Movimiento.objects.filter(
        tipo='ingreso', fecha__month=mes_actual, fecha__year=anio_actual
    ).aggregate(total=Sum('monto'))['total'] or 0

    egresos_mes = Movimiento.objects.filter(
        tipo='egreso', fecha__month=mes_actual, fecha__year=anio_actual
    ).aggregate(total=Sum('monto'))['total'] or 0

    deudas_total = Deuda.objects.filter(
        estado__in=['pendiente', 'parcial']
    ).aggregate(total=Sum('monto_total'))['total'] or 0

    # Saldo real desde Excel (si existe conciliación importada)
    conc = ConciliacionExcel.objects.order_by('-fecha_importacion').first()
    saldo_excel = conc.saldo_excel if conc else None
    diferencia = (saldo_excel - saldo) if saldo_excel is not None else None

    return Response({
        'saldo': saldo,
        'saldo_excel': saldo_excel,
        'diferencia_excel_sistema': diferencia,
        'ingresos_mes': ingresos_mes,
        'egresos_mes': egresos_mes,
        'deudas_total': deudas_total,
        'total_ingresos_historico': total_ingresos,
        'total_egresos_historico': total_egresos,
    })


@api_view(['POST'])
@permission_classes([IsAdminOrTesorero])
def importar_extracto_banco(request):
    """
    Importa un extracto bancario COOPEUCH.
    Acepta:
    - multipart/form-data con campo 'archivo' (PDF, Excel, CSV)
    - JSON con campo 'texto' (tabla copiada del navegador) + 'cuenta_id'
    """
    cuenta_id = request.data.get('cuenta_id')
    if not cuenta_id:
        return Response({'error': 'Se requiere cuenta_id.'}, status=400)

    try:
        cuenta = CuentaBanco.objects.get(pk=cuenta_id)
    except CuentaBanco.DoesNotExist:
        return Response({'error': 'Cuenta bancaria no encontrada.'}, status=404)

    archivo = request.FILES.get('archivo')
    texto_pegado = request.data.get('texto', '').strip()

    if not archivo and not texto_pegado:
        return Response({'error': 'Se requiere un archivo (PDF/Excel/CSV) o texto pegado.'}, status=400)

    if archivo:
        contenido = archivo.read()
        filename = archivo.name
        archivo.seek(0)
        importacion = ImportacionArchivo.objects.create(
            archivo=archivo,
            tipo='conciliacion',
            estado='pendiente',
            importado_por=request.user,
        )
    else:
        # Texto pegado: guardamos como archivo virtual
        contenido = texto_pegado.encode('utf-8')
        filename = 'paste.txt'
        from django.core.files.base import ContentFile
        importacion = ImportacionArchivo.objects.create(
            tipo='conciliacion',
            estado='pendiente',
            importado_por=request.user,
        )
        importacion.archivo.save('paste.txt', ContentFile(contenido), save=True)

    try:
        filas = _parsear_extracto(contenido, filename)
    except ValueError as e:
        importacion.estado = 'error'
        importacion.mensaje = str(e)
        importacion.save(update_fields=['estado', 'mensaje'])
        return Response({'error': str(e)}, status=400)
    except Exception as e:
        importacion.estado = 'error'
        importacion.mensaje = f'Error inesperado al procesar: {e}'
        importacion.save(update_fields=['estado', 'mensaje'])
        return Response({'error': importacion.mensaje}, status=500)

    nuevos = 0
    duplicados = 0

    with transaction.atomic():
        for fila in filas:
            _, created = ExtractoMovimiento.objects.get_or_create(
                referencia_hash=fila['referencia_hash'],
                defaults={
                    'cuenta': cuenta,
                    'fecha': fila['fecha'],
                    'descripcion': fila['descripcion'],
                    'cargo': fila['cargo'],
                    'abono': fila['abono'],
                    'saldo': fila['saldo'],
                    'importacion': importacion,
                },
            )
            if created:
                nuevos += 1
            else:
                duplicados += 1

        importacion.estado = 'procesado'
        importacion.registros_procesados = nuevos
        importacion.mensaje = f'{nuevos} nuevas transacciones importadas, {duplicados} duplicadas omitidas.'
        importacion.save(update_fields=['estado', 'registros_procesados', 'mensaje'])

    return Response({
        'ok': True,
        'nuevos': nuevos,
        'duplicados': duplicados,
        'total_archivo': len(filas),
        'mensaje': importacion.mensaje,
    })


@api_view(['GET'])
@permission_classes([IsAdminOrTesorero])
def listar_extracto_banco(request):
    """Retorna el extracto bancario con filtros opcionales."""
    qs = ExtractoMovimiento.objects.select_related('cuenta', 'movimiento').all()

    cuenta_id = request.query_params.get('cuenta_id')
    estado = request.query_params.get('estado')
    desde = request.query_params.get('desde')
    hasta = request.query_params.get('hasta')

    if cuenta_id:
        qs = qs.filter(cuenta_id=cuenta_id)
    if estado:
        qs = qs.filter(estado_conciliacion=estado)
    if desde:
        qs = qs.filter(fecha__gte=desde)
    if hasta:
        qs = qs.filter(fecha__lte=hasta)

    # Resumen
    totales = qs.aggregate(
        total_abonos=Sum('abono'),
        total_cargos=Sum('cargo'),
    )

    page_size = 100
    offset = int(request.query_params.get('offset', 0))
    total = qs.count()
    items = qs[offset: offset + page_size]

    serializer = ExtractoMovimientoSerializer(items, many=True)
    return Response({
        'count': total,
        'offset': offset,
        'page_size': page_size,
        'total_abonos': totales['total_abonos'] or 0,
        'total_cargos': totales['total_cargos'] or 0,
        'results': serializer.data,
    })
