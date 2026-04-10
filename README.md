# IoT Sensor Monitoring System 🚀

Este proyecto es un ecosistema de monitoreo de sensores que combina un backend robusto en Rust, una interfaz de terminal (TUI) para configuración y nodos clientes en Python para la captura de datos.

## 📋 Requisitos Previos

-  Rust (Cargo) instalado.
- Python 3.x instalado.
- Librerías de Python: requests (puedes instalarla con pip install requests).

### 🛠️ Ejecución del Sistema

El sistema se divide en tres componentes principales. Sigue este orden para una ejecución correcta

1. El Servidor (Backend Rust)Es el corazón del sistema. Recibe los datos de los sensores, los guarda en un CSV y sirve el Dashboard web.
```Bash
cargo run
```
Por defecto, el servidor escuchará en el puerto 3000.

2. Modo Configuración (TUI Rust)
Utiliza esta interfaz para gestionar los nombres de los sensores, ver las IPs conocidas o administrar la lista negra.
```Bash
cargo run -- config
```
3. Nodos Sensores (Cliente Python)El script de Python simula o lee un sensor físico y envía los datos al servidor.
Se ejecuta usando el launcher.py

Sintaxis:
```Bash
python launcher.py --tipo [TIPO] --pin [PIN] --id [NOMBRE_ID] --ip [IP_SERVIDOR]
```
Ejemplo de uso:
```Bash
python launcher.py --tipo boton --pin 2 --id "boton_sala" --ip "127.0.0.1"
```
## 📁 Estructura de Archivos Clave
