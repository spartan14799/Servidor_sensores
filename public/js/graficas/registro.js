// js/graficas/registro.js
const EstrategiasGraficas = {
    estrategias: {},

    registrar: function(nombreMedida, funcionGraficar) {
        this.estrategias[nombreMedida] = funcionGraficar;
    },

    ejecutar: function(medida, datos, fechaFiltro, contenedor, graficasActivas) {
        const renderizador = this.estrategias[medida] || this.estrategias['default'];
        if (renderizador) {
            renderizador(datos, fechaFiltro, medida, contenedor, graficasActivas);
        }
    }
};
