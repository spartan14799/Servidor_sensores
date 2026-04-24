// js/graficas/default.js
EstrategiasGraficas.registrar('default', function(datos, fechaSeleccionada, medida, contenedor, arrayGraficasActivas) {
    const delDia = datos.filter(d => {
        const fStr = `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`;
        return fStr === fechaSeleccionada;
    });

    contenedor.innerHTML = `
        <div class="col-12 mb-4">
            <div class="card shadow-sm">
                <div class="card-header bg-white"><h5>Evolución de ${medida} (${fechaSeleccionada})</h5></div>
                <div class="card-body"><div style="height: 50vh;"><canvas id="chartSimple"></canvas></div></div>
            </div>
        </div>`;

    const ctx = document.getElementById('chartSimple').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: delDia.map(d => d.fecha.toLocaleTimeString()),
            datasets: [{
                label: medida,
                data: delDia.map(d => d.valor),
                borderColor: 'rgba(108, 117, 125, 0.8)',
                backgroundColor: 'rgba(108, 117, 125, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    arrayGraficasActivas.push(chart);
});
