import time
import board
import adafruit_dht
from cliente_iot import SensorBase

class SensorTempHumedad(SensorBase):
    def __init__(self, id_sensor, pin, ip_servidor="127.0.0.1", puerto="3000", tipo_dht="DHT11"):
        super().__init__(id_sensor, ip_servidor, puerto)
        
        pin_board = getattr(board, f"D{pin}")
        
        if tipo_dht == "DHT22":
            self.dht_device = adafruit_dht.DHT22(pin_board)
        else:
            self.dht_device = adafruit_dht.DHT11(pin_board)

    def iniciar_lectura(self):
        print(f"[{self.id_sensor}] Iniciando lectura de Temperatura y Humedad... Presiona Ctrl+C para salir.")
        while True:
            try:
                temperatura_c = self.dht_device.temperature
                humedad = self.dht_device.humidity
                if temperatura_c is not None and humedad is not None:
                    self.enviar_dato("temperatura", temperatura_c)
                    self.enviar_dato("humedad", humedad)
            except RuntimeError as error:
                print(f"[{self.id_sensor}] Error temporal de lectura: {error.args[0]}")
            except Exception as error:
                self.dht_device.exit()
                raise error
            time.sleep(5.0)
