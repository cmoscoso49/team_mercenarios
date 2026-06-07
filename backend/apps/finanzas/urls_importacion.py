from django.urls import path
from .views_importacion import ImportarExcelView, ImportacionListView

urlpatterns = [
    path('excel/', ImportarExcelView.as_view(), name='importar-excel'),
    path('historial/', ImportacionListView.as_view(), name='importacion-historial'),
]
