from django.db import migrations, models

# Matriz inicial de permisos según lo definido por el admin del team
SEED = [
    # modulo, rol, puede_ver, puede_editar
    ('dashboard',     'admin',      True,  True),
    ('dashboard',     'tesorero',   True,  True),
    ('dashboard',     'presidente', False, False),
    ('dashboard',     'TL',         False, False),
    ('dashboard',     'vice',       False, False),
    ('dashboard',     'secretario', False, False),

    ('integrantes',   'admin',      True,  True),
    ('integrantes',   'tesorero',   True,  True),
    ('integrantes',   'presidente', True,  False),
    ('integrantes',   'TL',         True,  False),
    ('integrantes',   'vice',       True,  False),
    ('integrantes',   'secretario', True,  False),

    ('finanzas',      'admin',      True,  True),
    ('finanzas',      'tesorero',   True,  True),
    ('finanzas',      'presidente', False, False),
    ('finanzas',      'TL',         False, False),
    ('finanzas',      'vice',       False, False),
    ('finanzas',      'secretario', False, False),

    ('reportes',      'admin',      True,  True),
    ('reportes',      'tesorero',   True,  True),
    ('reportes',      'presidente', False, False),
    ('reportes',      'TL',         False, False),
    ('reportes',      'vice',       False, False),
    ('reportes',      'secretario', False, False),

    ('eventos',       'admin',      True,  True),
    ('eventos',       'tesorero',   True,  True),
    ('eventos',       'presidente', False, False),
    ('eventos',       'TL',         False, False),
    ('eventos',       'vice',       False, False),
    ('eventos',       'secretario', True,  True),

    ('noticias',      'admin',      True,  True),
    ('noticias',      'tesorero',   True,  True),
    ('noticias',      'presidente', False, False),
    ('noticias',      'TL',         False, False),
    ('noticias',      'vice',       False, False),
    ('noticias',      'secretario', True,  True),

    ('instagram',     'admin',      True,  True),
    ('instagram',     'tesorero',   True,  True),
    ('instagram',     'presidente', False, False),
    ('instagram',     'TL',         False, False),
    ('instagram',     'vice',       False, False),
    ('instagram',     'secretario', True,  True),

    ('reclutamiento', 'admin',      True,  True),
    ('reclutamiento', 'tesorero',   True,  True),
    ('reclutamiento', 'presidente', False, False),
    ('reclutamiento', 'TL',         False, False),
    ('reclutamiento', 'vice',       False, False),
    ('reclutamiento', 'secretario', True,  True),
]


def seed_permisos(apps, schema_editor):
    PermisoModulo = apps.get_model('usuarios', 'PermisoModulo')
    for modulo, rol, ver, editar in SEED:
        PermisoModulo.objects.get_or_create(
            modulo=modulo, rol=rol,
            defaults={'puede_ver': ver, 'puede_editar': editar},
        )


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0002_alter_usuario_rol'),
    ]

    operations = [
        migrations.CreateModel(
            name='PermisoModulo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('modulo', models.CharField(choices=[('dashboard', 'Dashboard'), ('integrantes', 'Integrantes'), ('finanzas', 'Finanzas'), ('reportes', 'Reportes'), ('eventos', 'Eventos'), ('noticias', 'Noticias'), ('instagram', 'Instagram / Galería'), ('reclutamiento', 'Reclutamiento')], max_length=30)),
                ('rol', models.CharField(choices=[('admin', 'Administrador'), ('TL', 'Team Leader'), ('presidente', 'Presidente'), ('vice', 'Vice Presidente'), ('secretario', 'Secretario'), ('tesorero', 'Tesorero')], max_length=20)),
                ('puede_ver', models.BooleanField(default=False)),
                ('puede_editar', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Permiso de módulo',
                'verbose_name_plural': 'Permisos de módulo',
                'ordering': ['modulo', 'rol'],
                'unique_together': {('modulo', 'rol')},
            },
        ),
        migrations.RunPython(seed_permisos, migrations.RunPython.noop),
    ]
