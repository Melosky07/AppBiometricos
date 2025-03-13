from django.urls import path,  include
from rest_framework.routers import DefaultRouter
from .views import RegistroAsistenciaViewSet, exportar_reporte_excel, obtener_datos, buscar_persona

router = DefaultRouter()
router.register(r'registros', RegistroAsistenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('reporte-excel/', exportar_reporte_excel, name='exportar_reporte_excel'),
    path('datos/', obtener_datos, name='obtener_datos'),
    path('buscar-persona/', buscar_persona, name='buscar_persona'),
]