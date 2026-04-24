import time
from smbus2 import SMBus
from cliente_iot import SensorBase

class SensorLuz(SensorBase):
    def __init__(self, id_sensor, ip_servidor="127.0.0.1", puerto="3000"):
        super().__init__(id_sensor, ip_servidor, puerto)
        
        self.i2c_address = 0x23 
        self.bus = None
        
        try:
            self.bus = SMBus(1) 
        except Exception as e:
            print(f"[{id_sensor}] Error al inicializar I2C (SMBus): {e}")

    def iniciar_lectura(self):
        if not self.bus:
            print(f"[{self.id_sensor}] Bus I2C no disponible. Saliendo...")
            return
        
        print(f"[{self.id_sensor}] Leyendo intensidad lumínica con smbus2... (I2C)")
        
        modo_lectura = 0x10 
        
        while True:
            try:
                datos = self.bus.read_i2c_block_data(self.i2c_address, modo_lectura, 2)
                
                nivel_luz = ((datos[0] << 8) | datos[1]) / 1.2
                
                self.enviar_dato("luminosidad", round(nivel_luz, 2))
                
            except Exception as e:
                print(f"[{self.id_sensor}] Error de lectura I2C: {e}")
            time.sleep(2.0)
