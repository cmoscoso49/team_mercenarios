from django.apps import AppConfig


class IntegrantesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.integrantes'
    verbose_name = 'Integrantes'

    def ready(self):
        import apps.integrantes.signals  # noqa: F401
