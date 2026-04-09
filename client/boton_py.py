import json
from gpiozero import LED, Button
from signal import pause
from datetime import datetime

# Configuración de archivos y hardware
LOG_FILE = "registro_led.json"
led = LED(17)
button = Button(2)

def registrar_evento(accion):
    # Creamos la entrada con la fecha y hora actual
    nuevo_registro = {
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "evento": accion
    }
    
    try:
        # Intentamos leer el archivo existente
        with open(LOG_FILE, "r") as file:
            datos = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        # Si no existe o está vacío, empezamos una lista nueva
        datos = []

    # Añadimos el nuevo registro y guardamos
    datos.append(nuevo_registro)
    
    with open(LOG_FILE, "w") as file:
        json.dump(datos, file, indent=4)
    
    print(f"Registrado: {accion}")

# Funciones de envoltura para los eventos
def led_on():
    led.on()
    registrar_evento("oprimido")

def led_off():
    led.off()
    registrar_evento("soltado")

# Asignación de eventos
button.when_pressed = led_on
button.when_released = led_off

print("Sistema listo. Presiona el botón...")
pause()
