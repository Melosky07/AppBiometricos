from rest_framework import serializers
from .models import RegistroAsistencia, Persona

class RegistroAsistenciaSerializer(serializers.ModelSerializer):
    persona_nombre = serializers.CharField(source='persona.nombre', read_only=True)  # Nuevo campo con el nombre de la persona
    hora_entrada = serializers.SerializerMethodField()
    hora_salida = serializers.SerializerMethodField()
    tiempo_trabajado = serializers.SerializerMethodField()

    class Meta:
        model = RegistroAsistencia
        fields = ['id', 'fecha', 'hora_entrada', 'hora_salida', 'tiempo_trabajado', 'persona_nombre']


    def get_hora_entrada(self, obj):
        if obj.hora_entrada:
            return obj.hora_entrada.strftime('%H:%M:%S')
        return None

    def get_hora_salida(self, obj):
        if obj.hora_salida:
            return obj.hora_salida.strftime('%H:%M:%S')
        return None

    def get_tiempo_trabajado(self, obj):
        return obj.tiempo_trabajado() if obj.tiempo_trabajado() else ''
