from rest_framework import viewsets, status
from rest_framework.response import Response
from django.utils.timezone import localtime, now
from .models import Persona, RegistroAsistencia
from .serializers import RegistroAsistenciaSerializer
import csv
from django.http import HttpResponse
import logging
import pandas as pd
from django.http import JsonResponse
import os
from django.conf import settings

logger = logging.getLogger(__name__)

EXCEL_FILE_PATH = os.path.join(os.path.dirname(__file__), 'BD_Empleados.xlsx')


class RegistroAsistenciaViewSet(viewsets.ModelViewSet):
    queryset = RegistroAsistencia.objects.all()
    serializer_class = RegistroAsistenciaSerializer

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Request data: {request.data}")

            nit = request.data.get('NIT')

            if not nit:
                return Response({"error": "El NIT es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Intentar leer el archivo Excel
            try:
                df = pd.read_excel(EXCEL_FILE_PATH, engine='openpyxl')
            except Exception as e:
                logger.error(f"Error al leer el archivo Excel: {str(e)}")
                return Response({"error": "Error al leer la base de datos (Excel)"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # ✅ Asegurar que la columna NIT existe
            if 'NIT' not in df.columns or 'Nombre' not in df.columns:
                logger.error("El archivo Excel no tiene las columnas correctas")
                return Response({"error": "Archivo Excel incorrecto. Faltan columnas 'NIT' o 'Nombre'."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # ✅ Convertir NIT a string en caso de que haya tipos mezclados
            df['NIT'] = df['NIT'].astype(str)

        # ✅ Buscar persona en el Excel
            persona_data = df.loc[df['NIT'] == str(nit)].to_dict(orient='records')

            if not persona_data:
                return Response({"error": "No se encontró información para el NIT ingresado"}, status=status.HTTP_404_NOT_FOUND)

            nombre = persona_data[0]['Nombre']

        # ✅ Crear o buscar persona en la BD
            persona, created = Persona.objects.get_or_create(nombre=nombre)

            hoy = now().date()

            registro = RegistroAsistencia.objects.filter(
                persona=persona,
                fecha=hoy,
                hora_salida__isnull=True
            ).first()

            if registro:
                registro.hora_salida = localtime(now()).time()
                registro.save()
                mensaje = f"Salida registrada para {nombre}"
            else:
                RegistroAsistencia.objects.create(
                    persona=persona,
                    hora_entrada=localtime(now()).time()
                )
                mensaje = f"Entrada registrada para {nombre}"

            registros = RegistroAsistencia.objects.all()
            serializer = self.get_serializer(registros, many=True)
            return Response({"mensaje": mensaje, "registros": serializer.data}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error en el backend: {str(e)}")
            return Response({"error": "Error interno en el servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def cargar_datos_excel():
    try:
        df = pd.read_excel(EXCEL_FILE_PATH, engine='openpyxl')
        return df
    except Exception as e:
        print(f"Error al cargar el archivo Excel: {e}")
        return None

def obtener_datos(request):
    df = cargar_datos_excel()
    if df is not None:
        data = df.to_dict(orient='records')
        return JsonResponse(data, safe=False)
    else:
        return JsonResponse({'error': 'No se pudo cargar el archivo Excel'}, status=500)
    
def buscar_persona(request):
    nit = request.GET.get('NIT')
    if not nit:
        return JsonResponse({'error': 'El NIT es obligatorio'}, status=400)

    try:
        df = pd.read_excel(EXCEL_FILE_PATH)
        persona = df.loc[df['NIT'] == int(nit)].to_dict(orient='records')
        if persona:
            return JsonResponse(persona[0])
        else:
            return JsonResponse({'error': 'No se encontró información para el NIT ingresado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Error al buscar en el archivo: {str(e)}'}, status=500)    

def exportar_reporte_excel(request):
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="reporte_asistencia.csv"'},
    )

    writer = csv.writer(response)
    writer.writerow(['Nombre', 'Fecha', 'Hora Entrada', 'Hora Salida', 'Tiempo Trabajado'])

    registros = RegistroAsistencia.objects.select_related('persona').all()

    for registro in registros:
        writer.writerow([
            registro.persona.nombre,
            registro.fecha,
            registro.hora_entrada.strftime('%H:%M:%S'),
            registro.hora_salida.strftime('%H:%M:%S') if registro.hora_salida else '',
            registro.tiempo_trabajado(), 
        ])

    return response