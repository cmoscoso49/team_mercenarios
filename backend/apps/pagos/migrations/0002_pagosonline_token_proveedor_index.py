from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pagos', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pagoonline',
            name='token_proveedor',
            field=models.CharField(blank=True, db_index=True, max_length=255),
        ),
    ]
