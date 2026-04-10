from gpiozero import Button
from signal import pause
from cliente_iot import SensorBase
import argparse

class SensorBoton(SensorBase):
    def __init__(self, id_sensor, pin, ip_servidor="127.0.0.1", puerto="3000"):
        super().__init__(id_sensor, ip_servidor, puerto)
        self.pin = pin
        
        self.boton = Button(self.pin)

    def al_presionar(self):
        print("¡Botón oprimido!")
        self.enviar_dato("pulsacion", 1.0)

    def al_soltar(self):
        print("¡Botón soltado!")
        self.enviar_dato("pulsacion", 0.0)

    def iniciar_lectura(self):
        print(f"[{self.id_sensor}] Escuchando eventos en el GPIO {self.pin}...")
        
        self.boton.when_pressed = self.al_presionar
        self.boton.when_released = self.al_soltar
        
        pause()


