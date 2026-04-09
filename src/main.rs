use axum::{
    routing::{get, post},
    Router,
    Json,
    response::{Html, IntoResponse},
};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;

#[derive(Deserialize, Serialize, Debug)]
struct DatosSensor {
    sensor: String,
    estado: String,
    timestamp: f64,
}

#[tokio::main]
async fn main() {
    if !std::path::Path::new("datos.csv").exists() {
        let mut file = OpenOptions::new().create(true).write(true).open("datos.csv").unwrap();
        writeln!(file, "Timestamp,Sensor,Valor").unwrap();
    }

    let app = Router::new()
        .route("/", get(pagina_principal))        
        .route("/datos", post(recibir_datos))
        .route("/api/datos", get(obtener_csv));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Servidor web corriendo en http://localhost:3000");
    
    axum::serve(listener, app).await.unwrap();
}

// Recibe el JSON, lo convierte a CSV y lo guarda
async fn recibir_datos(Json(payload): Json<DatosSensor>) -> String {
    let valor_numerico = if payload.estado == "oprimido" { 1 } else { 0 };
    
    let mut file = OpenOptions::new().append(true).open("datos.csv").unwrap();
    writeln!(file, "{},{},{}", payload.timestamp, payload.sensor, valor_numerico).unwrap();
    
    println!("Guardado: {} -> {}", payload.sensor, payload.estado);
    format!("Datos guardados exitosamente")
}

async fn pagina_principal() -> impl IntoResponse {
    let contenido = std::fs::read_to_string("index.html").unwrap_or_else(|_| "<h1>Error: Archivo index.html no encontrado</h1>".to_string());
    Html(contenido)
}


async fn obtener_csv() -> impl IntoResponse {
    std::fs::read_to_string("datos.csv").unwrap_or_default()
}
