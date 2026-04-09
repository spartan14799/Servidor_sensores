import requests
from gpiozero import LED, Button
from signal import pause
from datetime import datetime

# Configuración de hardware y red
URL_SERVIDOR = "http://localhost:3000/datos"
led = LED(17)
button = Button(2)

def registrar_evento(accion):
    nuevo_registro = {
        "sensor": "boton_1",
        "estado": accion,
        "timestamp": datetime.now().timestamp()
    }
    
    try:
        respuesta = requests.post(URL_SERVIDOR, json=nuevo_registro)
        print(f"Registrado en servidor: {accion} (Status: {respuesta.status_code})")
    except Exception as e:
        print(f"Error conectando con el servidor: {e}")

def led_on():
    led.on()
    registrar_evento("oprimido")

def led_off():
    led.off()
    registrar_evento("soltado")

button.when_pressed = led_on
button.when_released = led_off

print("Sistema cliente listo.")
pause()
