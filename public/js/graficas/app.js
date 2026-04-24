let datosGlobales = [];
let graficasActivas = [];

async function cargarDatos() {
    try {
        const respuesta = await fetch("/api/datos");
        const json = await respuesta.json();
        if (json.length === 0) return;

        datosGlobales = json.map(d => ({
            fecha: new Date(d.timestamp * 1000),
            dispositivo: d.ip_origen || "Desconocido",
            sensor: d.sensor,
            medida: d.medicion.toLowerCase(),
            valor: parseFloat(d.valor)
        }));

        actualizarSelectores();
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

function actualizarSelectores() {
    // ... (exactamente igual que antes, usando procesarYGraficar al final)
}

function procesarYGraficar() {
    const disp = document.getElementById("selectorDispositivo").value;
    const sens = document.getElementById("selectorSensor").value;
    const med = document.getElementById("selectorMedida").value;
    const fechaFiltro = document.getElementById("fechaFiltro").value;
    const contenedor = document.getElementById("contenedor-graficas-dinamico");

    if (!disp || !sens || !med) return;

    // Limpiar gráficas anteriores
    graficasActivas.forEach(g => g.destroy());
    graficasActivas = [];

    const datosFiltrados = datosGlobales.filter(d => d.dispositivo === disp && d.sensor === sens && d.medida === med);

    // Ocultar fecha si es pulsación
    const fechaContainer = document.getElementById("fechaFiltro").closest('.col-md-3');
    if (med === 'pulsacion') {
        fechaContainer.style.display = 'none';
    } else {
        fechaContainer.style.display = '';
        if (!fechaFiltro) return;
    }

    // Delegar renderizado a la estrategia correspondiente
    EstrategiasGraficas.ejecutar(med, datosFiltrados, fechaFiltro, contenedor, graficasActivas);
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById("fechaFiltro").value = hoy;

    document.getElementById("selectorDispositivo").onchange = actualizarSelectores;
    document.getElementById("selectorSensor").onchange = actualizarSelectores;
    document.getElementById("selectorMedida").onchange = procesarYGraficar;
    document.getElementById("fechaFiltro").onchange = procesarYGraficar;

    cargarDatos();
    setInterval(cargarDatos, 5000);
});
