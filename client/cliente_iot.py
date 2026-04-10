import requests
from datetime import datetime
from abc import ABC, abstractmethod

class SensorBase(ABC):
    def __init__(self, id_sensor, ip_servidor="127.0.0.1", puerto="3000"):
        self.id_sensor = id_sensor
        self.url = f"http://{ip_servidor}:{puerto}/datos"

    def enviar_dato(self, medicion: str, valor: float):
        payload = {
            "id_sensor": self.id_sensor,
            "medicion": medicion,
            "valor": float(valor),
            "timestamp": datetime.now().timestamp()
        }
        try:
            respuesta = requests.post(self.url, json=payload)
            print(f"[{self.id_sensor}] Enviado {medicion}: {valor} -> {respuesta.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"[{self.id_sensor}] Error de conexión: {e}")

    @abstractmethod
    def iniciar_lectura(self):
        pass
