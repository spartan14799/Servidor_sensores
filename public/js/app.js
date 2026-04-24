let datosGlobales = [];
let graficasActivas = [];

// Configuración de nombres EXACTOS como vienen de Python
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
            medida: d.medicion,
            valor: parseFloat(d.valor)
        }));
        
        // Solo actualizamos selectores si están vacíos por primera vez
        if (document.getElementById("selectorDispositivo").options.length === 0) {
            actualizarSelectores();
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

function actualizarSelectores() {
    const selDisp = document.getElementById("selectorDispositivo");
    const selSens = document.getElementById("selectorSensor");
    const selMed = document.getElementById("selectorMedida");

    // Guardar valores actuales
    const valDisp = selDisp.value;
    const valSens = selSens.value;
    const valMed = selMed.value;

    const dispositivos = [...new Set(datosGlobales.map(d => d.dispositivo))];
    selDisp.innerHTML = dispositivos.map(d => `<option value="${d}">${d}</option>`).join("");
    if (valDisp && dispositivos.includes(valDisp)) selDisp.value = valDisp;

    const sensores = [...new Set(datosGlobales.filter(d => d.dispositivo === selDisp.value).map(d => d.sensor))];
    selSens.innerHTML = sensores.map(s => `<option value="${s}">${s}</option>`).join("");
    if (valSens && sensores.includes(valSens)) selSens.value = valSens;

    const medidas = [...new Set(datosGlobales.filter(d => d.dispositivo === selDisp.value && d.sensor === selSens.value).map(d => d.medida))];
    selMed.innerHTML = medidas.map(m => `<option value="${m}">${m}</option>`).join("");
    if (valMed && medidas.includes(valMed)) selMed.value = valMed;

    procesarYGraficar();
}

function procesarYGraficar() {
    const disp = document.getElementById("selectorDispositivo").value;
    const sens = document.getElementById("selectorSensor").value;
    const med = document.getElementById("selectorMedida").value;
    const fechaFiltro = document.getElementById("fechaFiltro").value;
    const contenedor = document.getElementById("contenedor-graficas-dinamico");

    if (!disp || !sens || !med || !fechaFiltro) return;

    // Limpiar gráficas anteriores
    graficasActivas.forEach(g => g.destroy());
    graficasActivas = [];

    const datosFiltrados = datosGlobales.filter(d => d.dispositivo === disp && d.sensor === sens && d.medida === med);
    const config = CONFIG_MEDIDAS[med] || { color: "rgba(100, 100, 100, 0.8)" };

    if (config.especial === "pulsacion") {
        contenedor.innerHTML = `
            <div class="col-12 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por Hora (${fechaFiltro})</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartHora"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones del Mes</h5></div><div class="card-body"><div style="height: 30vh;"><canvas id="chartMes"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones del Año</h5></div><div class="card-body"><div style="height: 30vh;"><canvas id="chartAnio"></canvas></div></div></div></div>`;
        dibujarGraficasBoton(datosFiltrados, fechaFiltro);
    } 
    else if (config.especial === "luminosidad") {
        contenedor.innerHTML = `
            <div class="col-12 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Luminosidad en Tiempo Real (${fechaFiltro})</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="luzCont"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Promedio Mensual</h5></div><div class="card-body"><div style="height: 30vh;"><canvas id="luzMes"></canvas></div></div></div></div>
            <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Promedio Anual</h5></div><div class="card-body"><div style="height: 30vh;"><canvas id="luzAnio"></canvas></div></div></div></div>`;
        dibujarGraficasLuminosidad(datosFiltrados, fechaFiltro, config);
    }
    else {
        contenedor.innerHTML = `
            <div class="col-12 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Evolución de ${med} (${fechaFiltro})</h5></div><div class="card-body"><div style="height: 50vh;"><canvas id="chartSimple"></canvas></div></div></div></div>`;
        dibujarGraficaSimple(datosFiltrados, fechaFiltro, config, med);
    }
}

function dibujarGraficasBoton(datos, fechaSeleccionada) {
    let porHora = new Array(24).fill(0), porDia = {}, porMes = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(d => {
        if (d.valor >= 1) {
            const fStr = d.fecha.toISOString().split('T')[0];
            if (fStr === fechaSeleccionada) porHora[d.fecha.getHours()]++;
            porDia[d.fecha.getDate()] = (porDia[d.fecha.getDate()] || 0) + 1;
            porMes[nombresMeses[d.fecha.getMonth()]] = (porMes[nombresMeses[d.fecha.getMonth()]] || 0) + 1;
        }
    });

    const opt = { responsive: true, maintainAspectRatio: false };
    graficasActivas.push(new Chart(document.getElementById("chartHora"), { type: 'bar', data: { labels: Array.from({length:24}, (_,i)=>`${i}:00`), datasets:[{label:'Pulsos', data:porHora, backgroundColor:'rgba(13,110,253,0.8)'}]}, options: opt }));
    
    const dias = Object.keys(porDia).sort((a,b)=>a-b);
    graficasActivas.push(new Chart(document.getElementById("chartMes"), { type: 'bar', data: { labels: dias.map(d=>`Día ${d}`), datasets:[{label:'Pulsos', data:dias.map(d=>porDia[d]), backgroundColor:'rgba(25,135,84,0.8)'}]}, options: opt }));
    
    const meses = Object.keys(porMes).sort((a,b)=>nombresMeses.indexOf(a)-nombresMeses.indexOf(b));
    graficasActivas.push(new Chart(document.getElementById("chartAnio"), { type: 'bar', data: { labels: meses, datasets:[{label:'Pulsos', data:meses.map(m=>porMes[m]), backgroundColor:'rgba(253,126,20,0.8)'}]}, options: opt }));
}

function dibujarGraficasLuminosidad(datos, fechaSeleccionada, config) {
    const delDia = datos.filter(d => d.fecha.toISOString().split('T')[0] === fechaSeleccionada);
    let sumMes = {}, countMes = {}, sumAnio = {}, countAnio = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(d => {
        const m = nombresMeses[d.fecha.getMonth()], a = d.fecha.getFullYear();
        sumMes[m] = (sumMes[m] || 0) + d.valor; countMes[m] = (countMes[m] || 0) + 1;
        sumAnio[a] = (sumAnio[a] || 0) + d.valor; countAnio[a] = (countAnio[a] || 0) + 1;
    });

    graficasActivas.push(new Chart(document.getElementById("luzCont"), { type: 'line', data: { labels: delDia.map(d=>d.fecha.toLocaleTimeString()), datasets:[{label:'Lux', data:delDia.map(d=>d.valor), borderColor:config.color, fill:true, backgroundColor: config.color.replace("0.8", "0.2")}]}, options: {responsive:true, maintainAspectRatio:false} }));

    const etiM = Object.keys(sumMes);
    graficasActivas.push(new Chart(document.getElementById("luzMes"), { type: 'bar', data: { labels: etiM, datasets:[{label:'Promedio Lux', data:etiM.map(m=>sumMes[m]/countMes[m]), backgroundColor:'rgba(23,162,184,0.8)'}]}, options: {responsive:true, maintainAspectRatio:false} }));

    const etiA = Object.keys(sumAnio);
    graficasActivas.push(new Chart(document.getElementById("luzAnio"), { type: 'bar', data: { labels: etiA, datasets:[{label:'Promedio Lux', data:etiA.map(a=>sumAnio[a]/countAnio[a]), backgroundColor:'rgba(111,66,193,0.8)'}]}, options: {responsive:true, maintainAspectRatio:false} }));
}

function dibujarGraficaSimple(datos, fechaSeleccionada, config, medida) {
    const delDia = datos.filter(d => d.fecha.toISOString().split('T')[0] === fechaSeleccionada);
    graficasActivas.push(new Chart(document.getElementById("chartSimple"), {
        type: 'line',
        data: {
            labels: delDia.map(d => d.fecha.toLocaleTimeString()),
            datasets: [{ label: `${medida} (${config.unidad || ''})`, data: delDia.map(d => d.valor), borderColor: config.color, tension: 0.3, fill: true, backgroundColor: config.color.replace("0.8", "0.2") }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    }));
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById("fechaFiltro").value = hoy;
    
    // Asignar eventos
    document.getElementById("selectorDispositivo").onchange = actualizarSelectores;
    document.getElementById("selectorSensor").onchange = actualizarSelectores;
    document.getElementById("selectorMedida").onchange = procesarYGraficar;
    document.getElementById("fechaFiltro").onchange = procesarYGraficar;

    cargarDatos();
    setInterval(cargarDatos, 5000); // Recarga cada 5 seg
});
