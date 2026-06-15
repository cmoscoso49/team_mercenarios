from django.db import models
from django.conf import settings


class Categoria(models.Model):
    TIPO_CHOICES = [('ingreso', 'Ingreso'), ('egreso', 'Egreso')]
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['tipo', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


class Movimiento(models.Model):
    TIPO_CHOICES = [('ingreso', 'Ingreso'), ('egreso', 'Egreso')]

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=12, decimal_places=0)
    descripcion = models.TextField()
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateField()
    comprobante = models.FileField(upload_to='finanzas/comprobantes/', null=True, blank=True)
    es_caja_chica = models.BooleanField(default=False)
    integrante = models.ForeignKey(
        'integrantes.Integrante', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='movimientos'
    )
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        verbose_name = 'Movimiento'
        verbose_name_plural = 'Movimientos'
        ordering = ['-fecha', '-fecha_creacion']

    def __str__(self):
        return f"{self.get_tipo_display()} ${self.monto} - {self.descripcion[:50]}"


class Mensualidad(models.Model):
    ESTADO_CHOICES = [
        ('pagada', 'Pagada'),
        ('pendiente', 'Pendiente'),
        ('exento', 'Exento'),
    ]
    MESES = [
        (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'),
        (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'),
        (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre'),
    ]

    integrante = models.ForeignKey(
        'integrantes.Integrante', on_delete=models.CASCADE, related_name='mensualidades'
    )
    anio = models.IntegerField()
    mes = models.IntegerField(choices=MESES)
    monto = models.DecimalField(max_digits=10, decimal_places=0, default=5000)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_pago = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Mensualidad'
        verbose_name_plural = 'Mensualidades'
        unique_together = [['integrante', 'anio', 'mes']]
        ordering = ['-anio', '-mes']

    def __str__(self):
        return f"{self.integrante} - {self.get_mes_display()} {self.anio} ({self.get_estado_display()})"


class Deuda(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('parcial', 'Parcial'),
        ('condonada', 'Condonada'),
    ]

    integrante = models.ForeignKey(
        'integrantes.Integrante', on_delete=models.CASCADE, related_name='deudas'
    )
    descripcion = models.CharField(max_length=200)
    monto_total = models.DecimalField(max_digits=10, decimal_places=0)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_origen = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Deuda'
        verbose_name_plural = 'Deudas'
        ordering = ['-fecha_origen']

    def __str__(self):
        return f"{self.integrante} - {self.descripcion} ${self.monto_total}"

    @property
    def monto_pendiente(self):
        return self.monto_total - self.monto_pagado


class CuentaBanco(models.Model):
    nombre = models.CharField(max_length=100)
    banco = models.CharField(max_length=100)
    numero_cuenta = models.CharField(max_length=50, blank=True)
    saldo = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    activa = models.BooleanField(default=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Cuenta Bancaria'
        verbose_name_plural = 'Cuentas Bancarias'

    def __str__(self):
        return f"{self.nombre} - {self.banco}"


class ImportacionArchivo(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesado', 'Procesado'),
        ('error', 'Error'),
    ]
    TIPO_CHOICES = [
        ('integrantes', 'Integrantes'),
        ('mensualidades', 'Mensualidades'),
        ('movimientos', 'Movimientos'),
        ('conciliacion', 'Conciliación Bancaria'),
    ]

    archivo = models.FileField(upload_to='importaciones/')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    mensaje = models.TextField(blank=True)
    registros_procesados = models.IntegerField(default=0)
    registros_con_error = models.IntegerField(default=0)
    fecha_importacion = models.DateTimeField(auto_now_add=True)
    importado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        verbose_name = 'Importación de Archivo'
        verbose_name_plural = 'Importaciones de Archivos'
        ordering = ['-fecha_importacion']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.fecha_importacion.strftime('%d/%m/%Y %H:%M')}"


class ConfiguracionCuota(models.Model):
    """Valor de cuota mensual editable. Solo se usa la más reciente con activa=True."""
    valor_cuota = models.DecimalField(max_digits=10, decimal_places=0, default=5000)
    moneda = models.CharField(max_length=5, default='CLP')
    vigencia_desde = models.DateField()
    observaciones = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Configuracion de Cuota'
        verbose_name_plural = 'Configuraciones de Cuota'
        ordering = ['-vigencia_desde']

    def __str__(self):
        return f'Cuota ${self.valor_cuota} {self.moneda} desde {self.vigencia_desde}'

    @classmethod
    def valor_vigente(cls):
        obj = cls.objects.filter(activa=True).order_by('-vigencia_desde').first()
        return obj.valor_cuota if obj else 5000


class ExtractoMovimiento(models.Model):
    """Fila de extracto bancario importado desde COOPEUCH (u otro banco)."""
    ESTADO_CHOICES = [
        ('sin_conciliar', 'Sin conciliar'),
        ('conciliado', 'Conciliado'),
        ('ignorado', 'Ignorado'),
    ]

    cuenta = models.ForeignKey(CuentaBanco, on_delete=models.CASCADE, related_name='extracto')
    fecha = models.DateField()
    descripcion = models.CharField(max_length=500)
    cargo = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    abono = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    saldo = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    referencia_hash = models.CharField(max_length=64, unique=True, db_index=True)
    estado_conciliacion = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='sin_conciliar')
    movimiento = models.ForeignKey(
        Movimiento, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='extracto_origen'
    )
    importacion = models.ForeignKey(
        ImportacionArchivo, on_delete=models.SET_NULL, null=True, blank=True
    )
    fecha_importacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Extracto Bancario'
        verbose_name_plural = 'Extractos Bancarios'
        ordering = ['-fecha', '-fecha_importacion']

    def __str__(self):
        tipo = f'+${self.abono}' if self.abono else f'-${self.cargo}'
        return f"{self.fecha} {tipo} — {self.descripcion[:50]}"


class ConciliacionExcel(models.Model):
    """Almacena los valores calculados directamente desde el Excel histórico."""
    fecha_importacion = models.DateTimeField(auto_now_add=True)
    origen_archivo = models.CharField(max_length=300)

    # Componentes de la fórmula =P7+P10-P13+L47+M2023.S34+RIFA.N36+M2024.S41+M2025.S35
    hcontable_caja_chica = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                                help_text='H.CONTABLE!P7 — Total caja chica + mensualidades 2022')
    hcontable_donaciones = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                               help_text='H.CONTABLE!P10 — Donaciones e ingresos')
    hcontable_gastos = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                           help_text='H.CONTABLE!P13 — Total gastos históricos')
    hcontable_efectivo_extra = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                                   help_text='H.CONTABLE!L47 — Efectivo adicional')
    mensualidades_2023 = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                             help_text='MENSUALIDADES 2023!S34')
    rifa_total = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                     help_text='RIFA!N36')
    mensualidades_2024 = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                             help_text='MENSUALIDADES 2024!S41')
    mensualidades_2025 = models.DecimalField(max_digits=12, decimal_places=0, default=0,
                                             help_text='MENSUALIDADES 2025!S35')

    @property
    def saldo_excel(self):
        return (self.hcontable_caja_chica + self.hcontable_donaciones
                - self.hcontable_gastos + self.hcontable_efectivo_extra
                + self.mensualidades_2023 + self.rifa_total
                + self.mensualidades_2024 + self.mensualidades_2025)

    class Meta:
        verbose_name = 'Conciliación Excel'
        verbose_name_plural = 'Conciliaciones Excel'
        ordering = ['-fecha_importacion']

    def __str__(self):
        return f'Conciliación Excel {self.fecha_importacion.strftime("%d/%m/%Y")} — ${self.saldo_excel}'
