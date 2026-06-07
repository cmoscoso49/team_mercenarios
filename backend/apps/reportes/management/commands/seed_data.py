from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Crea datos de prueba para team_mercenarios'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos de prueba...')
        self._crear_categorias()
        self._crear_integrantes()
        self._crear_movimientos()
        self._crear_mensualidades()
        self._crear_eventos()
        self._crear_noticias()
        self.stdout.write(self.style.SUCCESS('Datos de prueba creados exitosamente.'))

    def _crear_categorias(self):
        from apps.finanzas.models import Categoria
        categorias = [
            ('Mensualidades', 'ingreso'),
            ('Donaciones', 'ingreso'),
            ('Rifas', 'ingreso'),
            ('Campeonatos', 'ingreso'),
            ('Equipamiento', 'egreso'),
            ('Campo de juego', 'egreso'),
            ('Refrigerios', 'egreso'),
            ('Poleras', 'egreso'),
            ('Transporte', 'egreso'),
            ('Comunicaciones', 'egreso'),
        ]
        for nombre, tipo in categorias:
            Categoria.objects.get_or_create(nombre=nombre, tipo=tipo)
        self.stdout.write(f'  {len(categorias)} categorías creadas')

    def _crear_integrantes(self):
        from apps.integrantes.models import Integrante
        integrantes_data = [
            ('Juan Pérez González', '12.345.678-9', 'Ghost', '987654321', 'activo', 'capitan', 'L'),
            ('Carlos Muñoz Silva', '13.456.789-0', 'Reaper', '976543210', 'activo', 'tesorero', 'M'),
            ('Pedro Rojas Castro', '14.567.890-1', 'Viper', '965432109', 'activo', 'integrante', 'XL'),
            ('Diego Torres Morales', '15.678.901-2', 'Phoenix', '954321098', 'activo', 'integrante', 'L'),
            ('Andrés Soto Vargas', '16.789.012-3', 'Shadow', '943210987', 'activo', 'integrante', 'M'),
            ('Felipe Cáceres Ibáñez', '17.890.123-4', 'Hawk', '932109876', 'activo', 'integrante', 'S'),
            ('Rodrigo Fuentes Pino', '18.901.234-5', 'Wolf', '921098765', 'inactivo', 'integrante', 'L'),
            ('Mauricio López Reyes', '19.012.345-6', 'Blade', '910987654', 'activo', 'integrante', 'XXL'),
            ('Sebastián Vega Campos', '20.123.456-7', 'Thunder', '909876543', 'postulante', 'postulante', 'M'),
            ('Nicolás Herrera Díaz', '21.234.567-8', 'Steel', '898765432', 'activo', 'integrante', 'L'),
        ]
        created = 0
        for nombre, rut, nick, tel, estado, rol, talla in integrantes_data:
            obj, c = Integrante.objects.get_or_create(
                rut=rut,
                defaults={
                    'nombre': nombre, 'nick': nick, 'telefono': tel,
                    'estado': estado, 'rol': rol, 'talla_polera': talla,
                    'fecha_ingreso': date(2022, random.randint(1, 12), random.randint(1, 28)),
                }
            )
            if c:
                created += 1
        self.stdout.write(f'  {created} integrantes creados')

    def _crear_movimientos(self):
        from apps.finanzas.models import Movimiento, Categoria
        cat_mens = Categoria.objects.filter(nombre='Mensualidades').first()
        cat_equip = Categoria.objects.filter(nombre='Equipamiento').first()
        cat_campo = Categoria.objects.filter(nombre='Campo de juego').first()
        cat_trans = Categoria.objects.filter(nombre='Transporte').first()

        movimientos = [
            ('ingreso', 50000, 'Mensualidades enero 2026', cat_mens, date(2026, 1, 5)),
            ('ingreso', 50000, 'Mensualidades febrero 2026', cat_mens, date(2026, 2, 5)),
            ('ingreso', 50000, 'Mensualidades marzo 2026', cat_mens, date(2026, 3, 5)),
            ('ingreso', 50000, 'Mensualidades abril 2026', cat_mens, date(2026, 4, 5)),
            ('ingreso', 50000, 'Mensualidades mayo 2026', cat_mens, date(2026, 5, 5)),
            ('egreso', 25000, 'Arriendo campo Colina partida enero', cat_campo, date(2026, 1, 15)),
            ('egreso', 18000, 'Transporte partida febrero', cat_trans, date(2026, 2, 20)),
            ('egreso', 35000, 'Compra de BBs y consumibles', cat_equip, date(2026, 3, 10)),
            ('egreso', 25000, 'Arriendo campo partida marzo', cat_campo, date(2026, 3, 22)),
            ('ingreso', 30000, 'Rifa interna Team Mercenarios', None, date(2026, 4, 1)),
            ('egreso', 15000, 'Combustible traslado equipos', cat_trans, date(2026, 4, 18)),
            ('egreso', 22000, 'Refrigerios reunión mensual', None, date(2026, 5, 3)),
        ]
        created = 0
        for tipo, monto, desc, cat, fecha in movimientos:
            if not Movimiento.objects.filter(descripcion=desc).exists():
                Movimiento.objects.create(tipo=tipo, monto=monto, descripcion=desc,
                                          categoria=cat, fecha=fecha)
                created += 1
        self.stdout.write(f'  {created} movimientos creados')

    def _crear_mensualidades(self):
        from apps.integrantes.models import Integrante
        from apps.finanzas.models import Mensualidad
        activos = list(Integrante.objects.filter(estado='activo'))
        created = 0
        for integrante in activos:
            for mes in range(1, 6):
                estado = 'pagada' if random.random() > 0.2 else 'pendiente'
                _, c = Mensualidad.objects.get_or_create(
                    integrante=integrante, anio=2026, mes=mes,
                    defaults={'monto': 5000, 'estado': estado,
                               'fecha_pago': date(2026, mes, random.randint(1, 10)) if estado == 'pagada' else None}
                )
                if c:
                    created += 1
        self.stdout.write(f'  {created} mensualidades creadas')

    def _crear_eventos(self):
        from apps.eventos.models import Evento
        eventos = [
            ('Partida Mensual Enero 2026', 'partida', date(2026, 1, 15), 'Campo Colina Norte', 'realizado'),
            ('Reunión Directiva Febrero 2026', 'reunion', date(2026, 2, 10), 'Sede del Team', 'realizado'),
            ('Partida Mensual Febrero 2026', 'partida', date(2026, 2, 22), 'Campo Colina Norte', 'realizado'),
            ('Entrenamiento Táctico Marzo 2026', 'entrenamiento', date(2026, 3, 8), 'Sede del Team', 'realizado'),
            ('Partida Mensual Marzo 2026', 'partida', date(2026, 3, 22), 'Campo El Sauce', 'realizado'),
            ('Campeonato Regional 2026', 'campeonato', date(2026, 4, 12), 'Campo La Serena', 'realizado'),
            ('Partida Mensual Mayo 2026', 'partida', date(2026, 5, 17), 'Campo Colina Norte', 'realizado'),
            ('Partida Mensual Junio 2026', 'partida', date(2026, 6, 21), 'Campo Colina Norte', 'programado'),
            ('Entrenamiento Julio 2026', 'entrenamiento', date(2026, 7, 5), 'Sede del Team', 'programado'),
            ('Campeonato Nacional Airsoft 2026', 'campeonato', date(2026, 8, 15), 'Santiago Centro', 'programado'),
        ]
        created = 0
        for titulo, tipo, fecha, lugar, estado in eventos:
            _, c = Evento.objects.get_or_create(
                titulo=titulo,
                defaults={'tipo': tipo, 'fecha': fecha, 'lugar': lugar, 'estado': estado,
                          'descripcion': f'Evento oficial del Team Mercenarios - {titulo}'}
            )
            if c:
                created += 1
        self.stdout.write(f'  {created} eventos creados')

    def _crear_noticias(self):
        from apps.noticias.models import Noticia
        noticias = [
            ('¡Team Mercenarios gana el Campeonato Regional 2026!', 'publicado', True,
             'El equipo logró una destacada actuación en el Campeonato Regional, quedando en primer lugar.'),
            ('Nuevos integrantes para la temporada 2026', 'publicado', False,
             'Damos la bienvenida a dos nuevos postulantes que se integran a nuestras filas esta temporada.'),
            ('Próxima partida en Campo Colina Norte', 'publicado', False,
             'Confirmamos la partida mensual para el 21 de junio en Campo Colina Norte.'),
            ('Actualización de reglamento interno 2026', 'publicado', False,
             'Se actualiza el reglamento del Team para la temporada 2026.'),
            ('Convocatoria Campeonato Nacional Agosto', 'borrador', False,
             'Preparamos la convocatoria oficial para el Campeonato Nacional de Agosto 2026.'),
        ]
        created = 0
        for titulo, estado, destacada, contenido in noticias:
            _, c = Noticia.objects.get_or_create(
                titulo=titulo,
                defaults={'estado': estado, 'destacada': destacada, 'contenido': contenido,
                          'resumen': contenido[:100], 'visibilidad': 'integrantes'}
            )
            if c:
                created += 1
        self.stdout.write(f'  {created} noticias creadas')
