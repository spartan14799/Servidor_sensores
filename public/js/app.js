let chartDiario, chartMensual, chartAnual;
let datosGlobales = [];

function cambiarVista(idVista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById(idVista).classList.add('activa');
}

document.addEventListener("DOMContentLoaded", () => {
    // Poner la fecha actual por defecto en el input
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    const inputFecha = document.getElementById("fechaFiltro");
    if (inputFecha) inputFecha.value = `${anio}-${mes}-${dia}`;

    cambiarVista('vista-sensores');
    cargarDatos();
    
    // Auto-actualización
    setInterval(cargarDatos, 2000);
});

async function cargarDatos() {
    try {
        const respuesta = await fetch("/api/datos");
        const csv = await respuesta.text();
        const lineas = csv.trim().split("\n").slice(1);

        let sensoresUnicos = new Set();
        datosGlobales = [];

        lineas.forEach(linea => {
            if (!linea) return;
            const columnas = linea.split(",");
            const timestamp = columnas[0];
            const sensor = columnas[1];
            const valorStr = columnas[3];

            sensoresUnicos.add(sensor);
            datosGlobales.push({
                fecha: new Date(parseFloat(timestamp) * 1000),
                sensor: sensor,
                valor: parseInt(valorStr) // 1 = Pulsación
            });
        });

        actualizarSelector(sensoresUnicos);
        procesarYGraficar();

    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

function actualizarSelector(sensores) {
    const selector = document.getElementById("selectorSensor");
    if (!selector) return;
    const valorActual = selector.value;

    if (selector.options.length - 1 !== sensores.size) {
        selector.innerHTML = '<option value="todos">Todos los sensores</option>';
        sensores.forEach(s => {
            selector.innerHTML += `<option value="${s}">Sensor: ${s}</option>`;
        });
        if (Array.from(selector.options).some(opt => opt.value === valorActual)) {
            selector.value = valorActual;
        }
    }
}

function procesarYGraficar() {
    const selector = document.getElementById("selectorSensor");
    const inputFecha = document.getElementById("fechaFiltro");
    
    if (!selector || !inputFecha) return;

    const sensorElegido = selector.value;
    const fechaSeleccionada = inputFecha.value;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    let conteoPorHora = new Array(24).fill(0);
    let conteoPorDia = {};
    let conteoPorMes = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datosGlobales.forEach(dato => {
        if (sensorElegido !== "todos" && dato.sensor !== sensorElegido) return;

        // Si el valor es 1 (pulsado), lo contamos
        if (dato.valor === 1) {
            const fecha = dato.fecha;
            
            const anioCSV = fecha.getFullYear();
            const mesCSV = String(fecha.getMonth() + 1).padStart(2, "0");
            const diaCSV = String(fecha.getDate()).padStart(2, "0");
            const fechaCSVStr = `${anioCSV}-${mesCSV}-${diaCSV}`;

            // Diaria
            if (fechaCSVStr === fechaSeleccionada) {
                const hora = fecha.getHours();
                conteoPorHora[hora]++;
            }

            // Mensual
            if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
                const dia = fecha.getDate().toString();
                conteoPorDia[dia] = (conteoPorDia[dia] || 0) + 1;
            }

            // Anual
            if (fecha.getFullYear() === anioActual) {
                const nombreMes = nombresMeses[fecha.getMonth()];
                conteoPorMes[nombreMes] = (conteoPorMes[nombreMes] || 0) + 1;
            }
        }
    });

    const titulo = document.getElementById("tituloDiario");
    if (titulo) titulo.innerText = `Pulsaciones por Hora (${fechaSeleccionada})`;

    dibujarGraficas(conteoPorHora, conteoPorDia, conteoPorMes);
}

function dibujarGraficas(conteoPorHora, conteoPorDia, conteoPorMes) {
    const opcionesGlobales = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    // 1. Gráfica Diaria
    const etiquetasHoras = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    if (chartDiario) {
        chartDiario.data.datasets[0].data = conteoPorHora;
        chartDiario.update();
    } else {
        const ctxD = document.getElementById("chartDiario").getContext("2d");
        chartDiario = new Chart(ctxD, {
            type: "bar",
            data: { labels: etiquetasHoras, datasets: [{ label: "Pulsaciones", data: conteoPorHora, backgroundColor: "rgba(13, 110, 253, 0.8)" }] },
            options: opcionesGlobales
        });
    }

    // 2. Gráfica Mensual
    const etiquetasMes = Object.keys(conteoPorDia).sort((a, b) => a - b);
    const datosMes = etiquetasMes.map(dia => conteoPorDia[dia]);
    if (chartMensual) {
        chartMensual.data.labels = etiquetasMes;
        chartMensual.data.datasets[0].data = datosMes;
        chartMensual.update();
    } else {
        const ctxM = document.getElementById("chartMensual").getContext("2d");
        chartMensual = new Chart(ctxM, {
            type: "bar",
            data: { labels: etiquetasMes, datasets: [{ label: "Pulsaciones", data: datosMes, backgroundColor: "rgba(25, 135, 84, 0.8)" }] },
            options: opcionesGlobales
        });
    }

    // 3. Gráfica Anual
    const mesesOrdenados = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const etiquetasAnio = Object.keys(conteoPorMes).sort((a, b) => mesesOrdenados.indexOf(a) - mesesOrdenados.indexOf(b));
    const datosAnio = etiquetasAnio.map(mes => conteoPorMes[mes]);
    
    if (chartAnual) {
        chartAnual.data.labels = etiquetasAnio;
        chartAnual.data.datasets[0].data = datosAnio;
        chartAnual.update();
    } else {
        const ctxA = document.getElementById("chartAnual").getContext("2d");
        chartAnual = new Chart(ctxA, {
            type: "bar",
            data: { labels: etiquetasAnio, datasets: [{ label: "Pulsaciones", data: datosAnio, backgroundColor: "rgba(253, 126, 20, 0.8)" }] },
            options: opcionesGlobales
        });
    }
}
