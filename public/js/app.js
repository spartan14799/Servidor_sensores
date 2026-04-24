let datosGlobales = [];
let graficasActivas = [];

// Configuración de medidas (todas en minúsculas)
const CONFIG_MEDIDAS = {
    "pulsacion": { color: "rgba(13, 110, 253, 0.8)", especial: "pulsacion" },
    "luminosidad": { color: "rgba(255, 193, 7, 0.8)", unidad: "Lux", especial: "luminosidad" },
    "temperatura": { color: "rgba(220, 53, 69, 0.8)", unidad: "°C" },
    "humedad": { color: "rgba(25, 135, 84, 0.8)", unidad: "%" }
};

function cambiarVista(idVista) {
    document.querySelectorAll('.vista').forEach(v => {
        v.classList.toggle('activa', v.id === idVista);
        v.classList.toggle('d-none', v.id !== idVista);
    });
}

async function cargarDatos() {
    try {
        const respuesta = await fetch("/api/datos");
        const json = await respuesta.json();
        if (json.length === 0) return;

        datosGlobales = json.map(d => ({
            fecha: new Date(d.timestamp * 1000),
            dispositivo: d.ip_origen || "Desconocido",
            sensor: d.sensor,
            medida: d.medicion.toLowerCase(), // Normalización
            valor: parseFloat(d.valor)
        }));

        actualizarSelectores();
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

function actualizarSelectores() {
    const selDisp = document.getElementById("selectorDispositivo");
    const selSens = document.getElementById("selectorSensor");
    const selMed = document.getElementById("selectorMedida");

    const valDisp = selDisp.value;
    const valSens = selSens.value;
    const valMed = selMed.value;

    const dispositivos = [...new Set(datosGlobales.map(d => d.dispositivo))];
    selDisp.innerHTML = dispositivos.map(d => `<option value="${d}">${d}</option>`).join("");
    if (valDisp && dispositivos.includes(valDisp)) selDisp.value = valDisp;
    else if (dispositivos.length > 0) selDisp.value = dispositivos[0];

    const dispSeleccionado = selDisp.value;
    const sensores = [...new Set(datosGlobales.filter(d => d.dispositivo === dispSeleccionado).map(d => d.sensor))];
    selSens.innerHTML = sensores.map(s => `<option value="${s}">${s}</option>`).join("");
    if (valSens && sensores.includes(valSens)) selSens.value = valSens;
    else if (sensores.length > 0) selSens.value = sensores[0];

    const sensSeleccionado = selSens.value;
    const medidas = [...new Set(datosGlobales.filter(d => d.dispositivo === dispSeleccionado && d.sensor === sensSeleccionado).map(d => d.medida))];
    selMed.innerHTML = medidas.map(m => `<option value="${m}">${m}</option>`).join("");
    if (valMed && medidas.includes(valMed)) selMed.value = valMed;
    else if (medidas.length > 0) selMed.value = medidas[0];

    procesarYGraficar();
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
    const config = CONFIG_MEDIDAS[med] || { color: "rgba(108, 117, 125, 0.8)", unidad: "" };

    // Mostrar/ocultar filtro de fecha según la medida
    const fechaContainer = document.getElementById("fechaFiltro").closest('.col-md-3');
    if (config.especial === "pulsacion") {
        fechaContainer.style.display = 'none';
    } else {
        fechaContainer.style.display = '';
        if (!fechaFiltro) return; // Para otras medidas, la fecha es obligatoria
    }

    if (config.especial === "pulsacion") {
        contenedor.innerHTML = `
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por minuto (hora actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartMinuto"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por día (mes actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartDia"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por mes (año actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartMes"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por año (histórico)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartAnio"></canvas></div></div></div></div>`;
        dibujarGraficasBoton(datosFiltrados);
    } else if (config.especial === "luminosidad") {
        contenedor.innerHTML = `
            <div class="col-12 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Luminosidad en Tiempo Real (${fechaFiltro})</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="luzCont"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Promedio Mensual</h5></div><div class="card-body"><div style="height: 30vh;"><canvas id="luzMes"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Promedio Anual</h5></div><div class="card-body"><div style="height: 30vh;"><canvas id="luzAnio"></canvas></div></div></div></div>`;
        dibujarGraficasLuminosidad(datosFiltrados, fechaFiltro, config);
    } else {
        contenedor.innerHTML = `
            <div class="col-12 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Evolución de ${med} (${fechaFiltro})</h5></div><div class="card-body"><div style="height: 50vh;"><canvas id="chartSimple"></canvas></div></div></div></div>`;
        dibujarGraficaSimple(datosFiltrados, fechaFiltro, config, med);
    }
}

function dibujarGraficasBoton(datos) {
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const mesActual = ahora.getMonth();      // 0-11
    const anioActual = ahora.getFullYear();

    // Inicializar contadores
    let porMinuto = new Array(60).fill(0);   // 0 a 59
    let porDia = {};                         // día del mes -> conteo
    let porMes = {};                         // nombre del mes -> conteo
    let porAnio = {};                        // año -> conteo
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(d => {
        if (d.valor >= 1) {  // Solo pulsaciones (presionar)
            const f = d.fecha;

            // Pulsaciones por minuto de la hora actual
            if (f.getFullYear() === anioActual &&
                f.getMonth() === mesActual &&
                f.getDate() === ahora.getDate() &&
                f.getHours() === horaActual) {
                porMinuto[f.getMinutes()]++;
            }

            // Pulsaciones por día del mes actual
            if (f.getFullYear() === anioActual && f.getMonth() === mesActual) {
                const dia = f.getDate();
                porDia[dia] = (porDia[dia] || 0) + 1;
            }

            // Pulsaciones por mes del año actual
            if (f.getFullYear() === anioActual) {
                const mesNombre = nombresMeses[f.getMonth()];
                porMes[mesNombre] = (porMes[mesNombre] || 0) + 1;
            }

            // Pulsaciones por año (histórico completo)
            porAnio[f.getFullYear()] = (porAnio[f.getFullYear()] || 0) + 1;
        }
    });

    const opciones = { responsive: true, maintainAspectRatio: false, animation: { duration: 0 } };

    // Gráfico 1: por minuto
    graficasActivas.push(new Chart(document.getElementById("chartMinuto"), {
        type: 'bar',
        data: {
            labels: Array.from({length: 60}, (_, i) => `${i}`),
            datasets: [{
                label: 'Pulsos',
                data: porMinuto,
                backgroundColor: 'rgba(13, 110, 253, 0.8)'
            }]
        },
        options: opciones
    }));

    // Gráfico 2: por día del mes
    const dias = Object.keys(porDia).sort((a, b) => a - b);
    graficasActivas.push(new Chart(document.getElementById("chartDia"), {
        type: 'bar',
        data: {
            labels: dias.map(d => `Día ${d}`),
            datasets: [{
                label: 'Pulsos',
                data: dias.map(d => porDia[d]),
                backgroundColor: 'rgba(25, 135, 84, 0.8)'
            }]
        },
        options: opciones
    }));

    // Gráfico 3: por mes del año
    const meses = Object.keys(porMes).sort((a, b) => nombresMeses.indexOf(a) - nombresMeses.indexOf(b));
    graficasActivas.push(new Chart(document.getElementById("chartMes"), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Pulsos',
                data: meses.map(m => porMes[m]),
                backgroundColor: 'rgba(255, 193, 7, 0.8)'
            }]
        },
        options: opciones
    }));

    // Gráfico 4: por año (histórico)
    const anios = Object.keys(porAnio).sort();
    graficasActivas.push(new Chart(document.getElementById("chartAnio"), {
        type: 'bar',
        data: {
            labels: anios,
            datasets: [{
                label: 'Pulsos',
                data: anios.map(a => porAnio[a]),
                backgroundColor: 'rgba(220, 53, 69, 0.8)'
            }]
        },
        options: opciones
    }));
}

function dibujarGraficasLuminosidad(datos, fechaSeleccionada, config) {
    const delDia = datos.filter(d => d.fecha.toISOString().split('T')[0] === fechaSeleccionada);
    let sumMes = {}, countMes = {}, sumAnio = {}, countAnio = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(d => {
        const m = nombresMeses[d.fecha.getMonth()];
        const a = d.fecha.getFullYear();
        sumMes[m] = (sumMes[m] || 0) + d.valor;
        countMes[m] = (countMes[m] || 0) + 1;
        sumAnio[a] = (sumAnio[a] || 0) + d.valor;
        countAnio[a] = (countAnio[a] || 0) + 1;
    });

    graficasActivas.push(new Chart(document.getElementById("luzCont"), {
        type: 'line',
        data: {
            labels: delDia.map(d => d.fecha.toLocaleTimeString()),
            datasets: [{
                label: 'Lux',
                data: delDia.map(d => d.valor),
                borderColor: config.color,
                backgroundColor: config.color.replace("0.8", "0.2"),
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    }));

    const etiM = Object.keys(sumMes).sort((a, b) => nombresMeses.indexOf(a) - nombresMeses.indexOf(b));
    graficasActivas.push(new Chart(document.getElementById("luzMes"), {
        type: 'bar',
        data: {
            labels: etiM,
            datasets: [{
                label: 'Promedio Lux',
                data: etiM.map(m => sumMes[m] / countMes[m]),
                backgroundColor: 'rgba(23, 162, 184, 0.8)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    }));

    const etiA = Object.keys(sumAnio).sort();
    graficasActivas.push(new Chart(document.getElementById("luzAnio"), {
        type: 'bar',
        data: {
            labels: etiA,
            datasets: [{
                label: 'Promedio Lux',
                data: etiA.map(a => sumAnio[a] / countAnio[a]),
                backgroundColor: 'rgba(111, 66, 193, 0.8)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    }));
}

function dibujarGraficaSimple(datos, fechaSeleccionada, config, medida) {
    const delDia = datos.filter(d => d.fecha.toISOString().split('T')[0] === fechaSeleccionada);
    graficasActivas.push(new Chart(document.getElementById("chartSimple"), {
        type: 'line',
        data: {
            labels: delDia.map(d => d.fecha.toLocaleTimeString()),
            datasets: [{
                label: `${medida} (${config.unidad || ''})`,
                data: delDia.map(d => d.valor),
                borderColor: config.color,
                backgroundColor: config.color.replace("0.8", "0.2"),
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    }));
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById("fechaFiltro");
    fechaInput.value = hoy;

    document.getElementById("selectorDispositivo").onchange = actualizarSelectores;
    document.getElementById("selectorSensor").onchange = actualizarSelectores;
    document.getElementById("selectorMedida").onchange = procesarYGraficar;
    fechaInput.onchange = procesarYGraficar;

    cargarDatos();
    setInterval(cargarDatos, 5000);
});
