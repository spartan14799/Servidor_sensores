// js/graficas/pulsacion.js
EstrategiasGraficas.registrar('pulsacion', function(datos, _fechaSeleccionada, _medida, contenedor, arrayGraficasActivas) {
    const ahora = new Date();
    const diaActual = ahora.getDate();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    let porHora = new Array(24).fill(0);
    let porDia = {};
    let porMes = {};
    let porAnio = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(d => {
        if (d.valor >= 1) { // Solo presiones (ignorar 0.0)
            const f = d.fecha;
            if (f.getFullYear() === anioActual && f.getMonth() === mesActual && f.getDate() === diaActual) {
                porHora[f.getHours()]++;
            }
            if (f.getFullYear() === anioActual && f.getMonth() === mesActual) {
                porDia[f.getDate()] = (porDia[f.getDate()] || 0) + 1;
            }
            if (f.getFullYear() === anioActual) {
                porMes[nombresMeses[f.getMonth()]] = (porMes[nombresMeses[f.getMonth()]] || 0) + 1;
            }
            porAnio[f.getFullYear()] = (porAnio[f.getFullYear()] || 0) + 1;
        }
    });

    contenedor.innerHTML = `
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por hora (hoy)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartHora"></canvas></div></div></div></div>
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por día (mes actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartDia"></canvas></div></div></div></div>
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por mes (año actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartMes"></canvas></div></div></div></div>
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5>Pulsaciones por año (histórico)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartAnio"></canvas></div></div></div></div>`;

    const opciones = { responsive: true, maintainAspectRatio: false };

    arrayGraficasActivas.push(new Chart(document.getElementById("chartHora"), {
        type: 'bar',
        data: {
            labels: Array.from({length:24}, (_, i) => `${i}:00`),
            datasets: [{ label: 'Pulsos', data: porHora, backgroundColor: 'rgba(13,110,253,0.8)' }]
        },
        options: opciones
    }));

    const dias = Object.keys(porDia).sort((a,b) => a-b);
    arrayGraficasActivas.push(new Chart(document.getElementById("chartDia"), {
        type: 'bar',
        data: {
            labels: dias.map(d => `Día ${d}`),
            datasets: [{ label: 'Pulsos', data: dias.map(d => porDia[d]), backgroundColor: 'rgba(25,135,84,0.8)' }]
        },
        options: opciones
    }));

    const meses = Object.keys(porMes).sort((a,b) => nombresMeses.indexOf(a)-nombresMeses.indexOf(b));
    arrayGraficasActivas.push(new Chart(document.getElementById("chartMes"), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{ label: 'Pulsos', data: meses.map(m => porMes[m]), backgroundColor: 'rgba(255,193,7,0.8)' }]
        },
        options: opciones
    }));

    const anios = Object.keys(porAnio).sort();
    arrayGraficasActivas.push(new Chart(document.getElementById("chartAnio"), {
        type: 'bar',
        data: {
            labels: anios,
            datasets: [{ label: 'Pulsos', data: anios.map(a => porAnio[a]), backgroundColor: 'rgba(220,53,69,0.8)' }]
        },
        options: opciones
    }));
});
