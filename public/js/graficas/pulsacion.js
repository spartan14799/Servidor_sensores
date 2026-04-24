// js/graficas/pulsacion.js

// 1. CAMBIO AQUÍ: 'pulsacion' en minúsculas
EstrategiasGraficas.registrar('pulsacion', function(datos, fechaSeleccionada, medida, arrayGraficasActivas) {
    const contenedor = document.getElementById("contenedor-graficas-dinamico");
    
    contenedor.innerHTML = `
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Por Hora (${fechaSeleccionada})</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartHora"></canvas></div></div></div></div>
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Por Día (Mes Actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartDia"></canvas></div></div></div></div>
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Por Mes (Año Actual)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartMes"></canvas></div></div></div></div>
        <div class="col-md-6 mb-4"><div class="card shadow-sm"><div class="card-header bg-white"><h5 class="card-title mb-0">Por Año (Histórico)</h5></div><div class="card-body"><div style="height: 35vh;"><canvas id="chartAnio"></canvas></div></div></div></div>
    `;

    const ahora = new Date();
    let conteoHora = new Array(24).fill(0);
    let conteoDia = {};
    let conteoMes = {};
    let conteoAnio = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    datos.forEach(d => {
        // 2. CAMBIO AQUÍ: validar que sea == 1 (presionado) e ignorar el 0 (soltado)
        if (d.valor >= 1) { 
            const fStr = `${d.fecha.getFullYear()}-${String(d.fecha.getMonth() + 1).padStart(2, "0")}-${String(d.fecha.getDate()).padStart(2, "0")}`;
            
            if (fStr === fechaSeleccionada) conteoHora[d.fecha.getHours()]++;
            
            if (d.fecha.getMonth() === ahora.getMonth() && d.fecha.getFullYear() === ahora.getFullYear()) {
                conteoDia[d.fecha.getDate()] = (conteoDia[d.fecha.getDate()] || 0) + 1;
            }
            if (d.fecha.getFullYear() === ahora.getFullYear()) {
                conteoMes[nombresMeses[d.fecha.getMonth()]] = (conteoMes[nombresMeses[d.fecha.getMonth()]] || 0) + 1;
            }
            conteoAnio[d.fecha.getFullYear()] = (conteoAnio[d.fecha.getFullYear()] || 0) + 1;
        }
    });

    const opciones = { responsive: true, maintainAspectRatio: false, animation: { duration: 0 } };
    const crearChart = (id, labels, data, color) => {
        const chart = new Chart(document.getElementById(id), {
            type: "bar", data: { labels: labels, datasets: [{ label: "Pulsaciones", data: data, backgroundColor: color }] }, options: opciones
        });
        arrayGraficasActivas.push(chart);
    };

    crearChart("chartHora", Array.from({length:24}, (_,i)=>`${i}:00`), conteoHora, "rgba(13, 110, 253, 0.8)");
    
    const etiDias = Object.keys(conteoDia).sort((a,b)=>a-b);
    crearChart("chartDia", etiDias.map(d=>`Día ${d}`), etiDias.map(d=>conteoDia[d]), "rgba(25, 135, 84, 0.8)");
    
    const etiMeses = Object.keys(conteoMes).sort((a,b)=>nombresMeses.indexOf(a)-nombresMeses.indexOf(b));
    crearChart("chartMes", etiMeses, etiMeses.map(m=>conteoMes[m]), "rgba(255, 193, 7, 0.8)");
    
    const etiAnios = Object.keys(conteoAnio).sort();
    crearChart("chartAnio", etiAnios, etiAnios.map(a=>conteoAnio[a]), "rgba(220, 53, 69, 0.8)");
});
