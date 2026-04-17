let datosGlobales = [];
let graficasActivas = [];

// Configuración de colores y tipos
const CONFIG_MEDIDAS = {
    "Pulsacion": { tipo: "bar", color: "rgba(13, 110, 253, 0.8)", especial: true },
    "Temperatura": { tipo: "line", color: "rgba(220, 53, 69, 0.8)", unidad: "°C" },
    "Humedad": { tipo: "line", color: "rgba(25, 135, 84, 0.8)", unidad: "%" },
    "Luminosidad": { tipo: "line", color: "rgba(255, 193, 7, 0.8)", unidad: "Lux" }
};

// --- FUNCIÓN PARA EL MENÚ LATERAL ---
function cambiarVista(idVista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa', 'd-none'));
    document.querySelectorAll('.vista').forEach(v => {
        if(v.id === idVista) {
            v.classList.add('activa');
        } else {
            v.classList.add('d-none');
        }
    });
}

// --- CARGA DE DATOS DESDE RUST/SQLITE ---
async function cargarDatos() {
    try {
        const respuesta = await fetch("/api/datos");
        const json = await respuesta.json(); 
        
        if (json.length === 0) return;

        // Mapeamos los datos de la DB al formato que usa el JS
        datosGlobales = json.map(d => ({
            fecha: new Date(d.timestamp * 1000),
            dispositivo: d.ip_origen || "Desconocido", 
            sensor: d.sensor,
            medida: d.medicion,
            valor: parseFloat(d.valor)
        }));

        actualizarSelectores();
    } catch (error) {
        console.error("Error al cargar JSON de la DB:", error);
    }
}

// --- LÓGICA DE FILTROS EN CASCADA ---
function actualizarSelectores() {
    const selDisp = document.getElementById("selectorDispositivo");
    const selSens = document.getElementById("selectorSensor");
    const selMed = document.getElementById("selectorMedida");

    const valDisp = selDisp.value;
    const valSens = selSens.value;
    const valMed = selMed.value;

    // 1. Dispositivos (IPs)
    const dispositivos = [...new Set(datosGlobales.map(d => d.dispositivo))];
    selDisp.innerHTML = dispositivos.map(d => `<option value="${d}">${d}</option>`).join("");
    if (valDisp && dispositivos.includes(valDisp)) selDisp.value = valDisp;

    // 2. Sensores
    const sensores = [...new Set(datosGlobales.filter(d => d.dispositivo === selDisp.value).map(d => d.sensor))];
    selSens.innerHTML = sensores.map(s => `<option value="${s}">${s}</option>`).join("");
    if (valSens && sensores.includes(valSens)) selSens.value = valSens;

    // 3. Medidas
    const medidas = [...new Set(datosGlobales.filter(d => d.dispositivo === selDisp.value && d.sensor === selSens.value).map(d => d.medida))];
    selMed.innerHTML = medidas.map(m => `<option value="${m}">${m}</option>`).join("");
    if (valMed && medidas.includes(valMed)) selMed.value = valMed;

    procesarYGraficar();
}

// Vinculamos los eventos a los selectores
document.getElementById("selectorDispositivo").onchange = actualizarSelectores;
document.getElementById("selectorSensor").onchange = actualizarSelectores;
document.getElementById("selectorMedida").onchange = procesarYGraficar;
document.getElementById("fechaFiltro").onchange = procesarYGraficar;


// --- LÓGICA PARA INYECTAR Y DIBUJAR LAS GRÁFICAS ---
function procesarYGraficar() {
    const disp = document.getElementById("selectorDispositivo").value;
    const sens = document.getElementById("selectorSensor").value;
    const med = document.getElementById("selectorMedida").value;
    const fechaFiltro = document.getElementById("fechaFiltro").value;
    const contenedor = document.getElementById("contenedor-graficas-dinamico");

    if (!disp || !sens || !med || !fechaFiltro) return;

    // Limpiar gráficas existentes
    graficasActivas.forEach(g => g.destroy());
    graficasActivas = [];

    // Filtramos la base de datos para la combinación elegida
    const datosFiltrados = datosGlobales.filter(d => d.dispositivo === disp && d.sensor === sens && d.medida === med);
    const config = CONFIG_MEDIDAS[med] || { tipo: "line", color: "rgba(100, 100, 100, 0.8)", especial: false };

    if (config.especial) {
        // CASO A: Es el botón (3 gráficas)
        contenedor.innerHTML = `
            <div class="col-12 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Pulsaciones por Hora (${fechaFiltro})</h5></div><div class="card-body"><div class="position-relative" style="height: 40vh;"><canvas id="chartDiario"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Pulsaciones (Mes Actual)</h5></div><div class="card-body"><div class="position-relative" style="height: 35vh;"><canvas id="chartMensual"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Pulsaciones (Año Actual)</h5></div><div class="card-body"><div class="position-relative" style="height: 35vh;"><canvas id="chartAnual"></canvas></div></div></div></div>
        `;
        dibujarGraficasBoton(datosFiltrados, fechaFiltro);
    } else {
        // CASO B: Sensor continuo (Temperatura, Humedad, Luz)
        contenedor.innerHTML = `
            <div class="col-12 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-white"><h5 class="card-title mb-0">Evolución de ${med} el ${fechaFiltro}</h5></div>
                    <div class="card-body"><div class="position-relative" style="height: 50vh;"><canvas id="chartContinuo"></canvas></div></div>
                </div>
            </div>
        `;
        dibujarGraficaContinua(datosFiltrados, fechaFiltro, config, med);
    }
}

function dibujarGraficasBoton(datos, fechaSeleccionada) {
    const ahora = new Date();
    let conteoPorHora = new Array(24).fill(0);
    let conteoPorDia = {};
    let conteoPorMes = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(dato => {
        if (dato.valor === 1) {
            const fecha = dato.fecha;
            const mesStr = String(fecha.getMonth() + 1).padStart(2, "0");
            const diaStr = String(fecha.getDate()).padStart(2, "0");
            const fechaCSVStr = `${fecha.getFullYear()}-${mesStr}-${diaStr}`;

            if (fechaCSVStr === fechaSeleccionada) conteoPorHora[fecha.getHours()]++;
            
            if (fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()) {
                conteoPorDia[fecha.getDate().toString()] = (conteoPorDia[fecha.getDate().toString()] || 0) + 1;
            }
            if (fecha.getFullYear() === ahora.getFullYear()) {
                const nombreMes = nombresMeses[fecha.getMonth()];
                conteoPorMes[nombreMes] = (conteoPorMes[nombreMes] || 0) + 1;
            }
        }
    });

    const opciones = { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } };

    graficasActivas.push(new Chart(document.getElementById("chartDiario").getContext("2d"), { type: "bar", data: { labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`), datasets: [{ label: "Pulsaciones", data: conteoPorHora, backgroundColor: "rgba(13, 110, 253, 0.8)" }] }, options: opciones }));
    
    const etiMes = Object.keys(conteoPorDia).sort((a, b) => a - b);
    graficasActivas.push(new Chart(document.getElementById("chartMensual").getContext("2d"), { type: "bar", data: { labels: etiMes, datasets: [{ label: "Pulsaciones", data: etiMes.map(d => conteoPorDia[d]), backgroundColor: "rgba(25, 135, 84, 0.8)" }] }, options: opciones }));
    
    const etiAnio = Object.keys(conteoPorMes).sort((a, b) => nombresMeses.indexOf(a) - nombresMeses.indexOf(b));
    graficasActivas.push(new Chart(document.getElementById("chartAnual").getContext("2d"), { type: "bar", data: { labels: etiAnio, datasets: [{ label: "Pulsaciones", data: etiAnio.map(m => conteoPorMes[m]), backgroundColor: "rgba(253, 126, 20, 0.8)" }] }, options: opciones }));
}

function dibujarGraficaContinua(datos, fechaSeleccionada, config, medida) {
    // Filtramos los datos para que solo grafique los del día que marcaste en el input
    const datosDelDia = datos.filter(d => {
        const mesStr = String(d.fecha.getMonth() + 1).padStart(2, "0");
        const diaStr = String(d.fecha.getDate()).padStart(2, "0");
        const fechaStr = `${d.fecha.getFullYear()}-${mesStr}-${diaStr}`;
        return fechaStr === fechaSeleccionada;
    });

    const ctx = document.getElementById("chartContinuo").getContext("2d");
    const chart = new Chart(ctx, {
        type: config.tipo,
        data: {
            labels: datosDelDia.map(d => d.fecha.toLocaleTimeString()),
            datasets: [{
                label: `${medida} ${config.unidad ? `(${config.unidad})` : ''}`,
                data: datosDelDia.map(d => d.valor),
                borderColor: config.color,
                tension: 0.3,
                fill: true,
                backgroundColor: config.color.replace("0.8", "0.2"), // Añade la transparencia bajo la línea
                borderWidth: 2,
                pointRadius: 2
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: { y: { beginAtZero: false } }
        }
    });
    graficasActivas.push(chart);
}

// --- ARRANQUE INICIAL ---
document.addEventListener("DOMContentLoaded", () => {
    // Fijar la fecha actual por defecto
    const hoy = new Date();
    const inputFecha = document.getElementById("fechaFiltro");
    if (inputFecha) inputFecha.value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

    cambiarVista('vista-sensores');
    cargarDatos();
    setInterval(cargarDatos, 5000); // Auto-refresco de la DB cada 5 segundos
});
