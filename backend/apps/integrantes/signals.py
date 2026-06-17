from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


@receiver(post_save, sender='integrantes.Integrante')
def crear_mensualidades_anio_actual(sender, instance, created, **kwargs):
    """Genera los 12 meses del año en curso como pendiente para integrantes activos."""
    if instance.estado != 'activo':
        return

    from apps.finanzas.models import Mensualidad, ConfiguracionCuota

    anio = timezone.now().year
    valor = ConfiguracionCuota.valor_vigente()

    meses_existentes = set(
        Mensualidad.objects.filter(integrante=instance, anio=anio).values_list('mes', flat=True)
    )
    nuevos = [
        Mensualidad(integrante=instance, anio=anio, mes=mes, monto=valor, estado='pendiente')
        for mes in range(1, 13)
        if mes not in meses_existentes
    ]
    if nuevos:
        Mensualidad.objects.bulk_create(nuevos)
