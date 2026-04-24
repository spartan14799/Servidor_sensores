// js/graficas/registro.js
const EstrategiasGraficas = {
    estrategias: {},
    graficasActivas: [],

    registrar: function(nombreMedida, funcionGraficar) {
        this.estrategias[nombreMedida] = funcionGraficar;
    },

    limpiar: function() {
        this.graficasActivas.forEach(g => g.destroy());
        this.graficasActivas = [];
        document.getElementById("contenedor-graficas-dinamico").innerHTML = "";
    },

    ejecutar: function(medida, datos, fechaFiltro) {
        this.limpiar();
        const renderizador = this.estrategias[medida] || this.estrategias['default'];
        if (renderizador) {
            renderizador(datos, fechaFiltro, medida, this.graficasActivas);
        }
    }
};
