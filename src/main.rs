use axum::{
    routing::{get, post},
    Router,
    Json,
    response::{Html, IntoResponse},
};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

#[derive(Deserialize, Serialize, Debug)]
struct DatosSensor {
    sensor: String,
    estado: String,
    timestamp: f64,
}

#[tokio::main]
async fn main() {
    if !Path::new("data").exists() {
        fs::create_dir_all("data").unwrap();
    }

    if !Path::new("data/datos.csv").exists() {
        let mut file = OpenOptions::new().create(true).write(true).open("data/datos.csv").unwrap();
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

async fn recibir_datos(Json(payload): Json<DatosSensor>) -> String {
    let valor_numerico: f64 = match payload.estado.as_str() {
        "oprimido" => 1.0,
        "soltado" => 0.0,
        otro => otro.parse().unwrap_or(0.0), 
    };
    
    let mut file = OpenOptions::new().append(true).open("data/datos.csv").unwrap();
    writeln!(file, "{},{},{}", payload.timestamp, payload.sensor, valor_numerico).unwrap();
    
    println!("Guardado: {} -> {}", payload.sensor, payload.estado);
    format!("Datos guardados exitosamente")
}

async fn pagina_principal() -> impl IntoResponse {
    let contenido = fs::read_to_string("public/index.html")
        .unwrap_or_else(|_| "<h1>Error: Archivo public/index.html no encontrado</h1>".to_string());
    Html(contenido)
}

async fn obtener_csv() -> impl IntoResponse {
    fs::read_to_string("data/datos.csv").unwrap_or_default()
}
