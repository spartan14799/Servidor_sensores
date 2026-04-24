// js/graficas/basica.js
EstrategiasGraficas.registrar('default', function(datos, fechaSeleccionada, medida, arrayGraficasActivas) {
    const contenedor = document.getElementById("contenedor-graficas-dinamico");
    
    contenedor.innerHTML = `
        <div class="col-12 mb-4">
            <div class="card shadow-sm">
                <div class="card-header bg-white"><h5 class="card-title mb-0">Evolución de ${medida} el ${fechaSeleccionada}</h5></div>
                <div class="card-body"><div class="position-relative" style="height: 50vh;"><canvas id="chartContinuo"></canvas></div></div>
            </div>
        </div>
    `;

    const datosDelDia = datos.filter(d => {
        const fechaStr = `${d.fecha.getFullYear()}-${String(d.fecha.getMonth() + 1).padStart(2, "0")}-${String(d.fecha.getDate()).padStart(2, "0")}`;
        return fechaStr === fechaSeleccionada;
    });

    const ctx = document.getElementById("chartContinuo").getContext("2d");
    const chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: datosDelDia.map(d => d.fecha.toLocaleTimeString()),
            datasets: [{
                label: medida,
                data: datosDelDia.map(d => d.valor),
                borderColor: "rgba(108, 117, 125, 0.8)",
                backgroundColor: "rgba(108, 117, 125, 0.2)",
                tension: 0.3, fill: true, borderWidth: 2, pointRadius: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 } }
    });
    arrayGraficasActivas.push(chart);
});
