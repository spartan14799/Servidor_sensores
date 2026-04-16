let chartSensor;
let datosGlobales = [];

let chartDiario, chartMensual, chartAnual;
let datosCrudos = [];

// Función para cambiar de vista actualizada
function cambiarVista(idVista) {
    // Quitamos la clase 'activa' a todas las vistas
    document.querySelectorAll('.vista').forEach(v => {
        v.classList.remove('activa');
    });
    // Añadimos la clase 'activa' a la vista seleccionada
    document.getElementById(idVista).classList.add('activa');
}

async function cargarDatos() {
    try {
        const respuesta = await fetch("/api/datos");
        const csv = await respuesta.text();
        const lineas = csv.trim().split("\n").slice(1);

        let sensoresUnicos = new Set();
        datosGlobales = [];

        lineas.forEach(linea => {
            if (!linea) return;
            // Asegúrate de que este split coincide con las 5 columnas de tu Rust (Timestamp,Sensor,Medicion,Valor,IP)
            const [timestamp, sensor, medicion, valor, ip] = linea.split(",");

            sensoresUnicos.add(sensor);
            datosGlobales.push({
                fecha: new Date(parseFloat(timestamp) * 1000),
                sensor: sensor,
                medicion: medicion,
                valor: parseFloat(valor),
                ip: ip // Guardamos la IP por si acaso
            });
        });

        actualizarSelector(sensoresUnicos);
        actualizarGraficaSensor();
    } catch (error) {
        console.error("Error cargando los datos:", error);
    }
}

function actualizarSelector(sensores) {
    const selector = document.getElementById("selectorSensor");
    const valorActual = selector.value;

    // Solo reescribir si la cantidad de sensores ha cambiado para evitar que el dropdown parpadee
    if (selector.options.length - 1 !== sensores.size) {
        selector.innerHTML = '<option value="todos">General (Todos los sensores)</option>';
        sensores.forEach(s => {
            selector.innerHTML += `<option value="${s}">Sensor: ${s}</option>`;
        });

        if (Array.from(selector.options).some(opt => opt.value === valorActual)) {
            selector.value = valorActual;
        }
    }
}

function procesarYGraficar() {
    actualizarGraficaSensor();
}

function actualizarGraficaSensor() {
    const selector = document.getElementById("selectorSensor");
    if (!selector) return;

    const sensorElegido = selector.value;

    const datosFiltrados = sensorElegido === "todos"
        ? datosGlobales
        : datosGlobales.filter(d => d.sensor === sensorElegido);

    console.log(`Dibujando gráfica para: ${sensorElegido} con ${datosFiltrados.length} registros`);
    // Aquí iría tu código de Chart.js
}

document.addEventListener("DOMContentLoaded", () => {
    cambiarVista('vista-rendimiento');
    cargarDatos();
    setInterval(cargarDatos, 5000);
});
