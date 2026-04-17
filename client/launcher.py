import argparse
from boton import SensorBoton
from dht import SensorTempHumedad
from BH1750 import SensorLuz

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lanzador de Sensores IoT")
    
    parser.add_argument("--tipo", type=str, required=True, 
                        choices=['boton','dht','bh1750'],
                        help="El tipo de sensor que deseas ejecutar")
    
    parser.add_argument("--pin", type=int, default=2, help="Pin BCM físico")
    parser.add_argument("--id", type=str, default="sensor_generico", help="ID del sensor")
    parser.add_argument("--ip", type=str, default="127.0.0.1", help="IP del servidor Rust")
    parser.add_argument("--puerto", type=str, default="3000", help="Puerto del servidor Rust")

    args = parser.parse_args()

    print("===================================")
    print(f"Iniciando Lanzador IoT")
    print(f"Tipo de Sensor: {args.tipo.upper()}")
    print(f"ID: {args.id}")
    print(f"Pin Físico: GPIO {args.pin}")
    print(f"Destino: http://{args.ip}:{args.puerto}/datos")
    print("===================================\n")

    sensor = None
    
    if args.tipo == "boton":
        sensor = SensorBoton(id_sensor=args.id, pin=args.pin, ip_servidor=args.ip, puerto=args.puerto)
    elif args.tipo == "dht":
        sensor = SensorTempHumedad(id_sensor=args.id, pin=args.pin, ip_servidor=args.ip, puerto=args.puerto)
    elif args.tipo == "bh1750":
        sensor = SensorLuz(id_sensor=args.id, ip_servidor=args.ip, puerto=args.puerto)


    if sensor:
        try:
            sensor.iniciar_lectura()
        except KeyboardInterrupt:
            print("\nSaliendo del programa...")
    else:
        print("Error: Tipo de sensor no implementado.")
