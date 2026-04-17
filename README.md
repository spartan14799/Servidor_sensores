# IoT Sensor Monitoring System 🚀

Este proyecto es un ecosistema de monitoreo de sensores que combina un backend robusto en Rust, una interfaz de terminal (TUI) para configuración y nodos clientes en Python para la captura de datos.

## 📋 Requisitos Previos

-  Rust (Cargo) instalado.
- Python 3.x instalado.
- Librerías de Python: requests (puedes instalarla con pip install requests).

### 🛠️ Ejecución del Sistema

El Servidor (Backend Rust)Es el corazón del sistema. Recibe los datos de los sensores, los guarda en una base de datos de sql y sirve el Dashboard web.

```Bash
cargo run
```
Por defecto, el servidor escuchará en el puerto 3000.

## 🚀 Ejecución de los Clientes (Nodos IoT)

Los scripts clientes están diseñados para ejecutarse en una Raspberry Pi (o cualquier dispositivo compatible con pines GPIO). Para garantizar un rendimiento óptimo y un manejo rápido de dependencias, este proyecto utiliza **`uv`** como gestor y ejecutor de Python.

Todos los sensores se inicializan a través del script principal `launcher.py`, el cual envía los datos al servidor Rust.

### ⚙️ Parámetros de Configuración

El archivo `launcher.py` recibe los siguientes argumentos desde la terminal para configurar su funcionamiento:

* `--tipo` **(Requerido)**: Define el sensor que se va a utilizar. Opciones válidas: `boton`, `dht`, `bh1750`.
* `--id`: Un nombre único para identificar tu dispositivo en el panel web (ej. `sensor_sala`, `boton_puerta`). *Por defecto: `sensor_generico`*.
* `--pin`: El número del pin físico BCM (GPIO) al que está conectado el sensor. *Por defecto: `2`*. (Nota: El sensor de luz BH1750 usa I2C, por lo que ignora este parámetro).
* `--ip`: La dirección IP donde se aloja el servidor Rust. *Por defecto: `127.0.0.1`*.
* `--puerto`: El puerto donde escucha el servidor Rust. *Por defecto: `3000`*.

---

### 💻 Ejemplos de Uso

Asegúrate de tener el servidor Rust ejecutándose antes de iniciar los clientes. En estos ejemplos usamos la IP `127.0.0.1` (`localhost`), asumiendo que el servidor Rust y los sensores se están ejecutando en la **misma Raspberry Pi**.

**1. Activar un Botón**
Supongamos que tienes un botón físico conectado al GPIO 17:

```bash
uv run launcher.py --tipo boton --id boton_sala --pin 17 --ip 127.0.0.1 --puerto 3000
```

