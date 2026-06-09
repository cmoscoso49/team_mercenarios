from django.db import models


class PagoOnline(models.Model):
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('completado', 'Completado'),
        ('fallido',    'Fallido'),
        ('expirado',   'Expirado'),
        ('cancelado',  'Cancelado'),
    ]

    integrante = models.ForeignKey(
        'integrantes.Integrante',
        on_delete=models.PROTECT,
        related_name='pagos_online',
    )
    mensualidades = models.ManyToManyField(
        'finanzas.Mensualidad',
        blank=True,
        related_name='pagos_online',
    )
    monto = models.DecimalField(max_digits=10, decimal_places=0)
    proveedor = models.CharField(max_length=20, default='flow')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    orden_id = models.CharField(max_length=100, unique=True)
    token_proveedor = models.CharField(max_length=255, blank=True)
    url_pago = models.URLField(max_length=500, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField()
    fecha_confirmacion = models.DateTimeField(null=True, blank=True)
    datos_respuesta = models.JSONField(default=dict)
    movimiento = models.ForeignKey(
        'finanzas.Movimiento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pago_origen',
    )

    class Meta:
        verbose_name = 'Pago Online'
        verbose_name_plural = 'Pagos Online'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'{self.integrante} - ${self.monto} - {self.get_estado_display()}'
