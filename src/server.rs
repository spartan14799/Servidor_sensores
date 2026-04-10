
use axum::{
    routing::{get, post},
    Router, Json, response::{Html, IntoResponse},
};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::env;
use dotenvy::dotenv;

#[derive(Deserialize, Serialize, Debug)]
struct DatosSensor {
    id_sensor: String,
    medicion: String,
    valor: f64,
    timestamp: f64,
}


pub async fn iniciar_servidor() {
    let _ = dotenv();
    
    let ip = env::var("IP_SERVIDOR").unwrap_or_else(|_| "0.0.0.0".to_string());
    let puerto = env::var("PUERTO_SERVIDOR").unwrap_or_else(|_| "3000".to_string());
    
    if !Path::new("data").exists() { fs::create_dir_all("data").unwrap(); }
    if !Path::new("data/datos.csv").exists() {
        let mut file = OpenOptions::new().create(true).write(true).open("data/datos.csv").unwrap();
        writeln!(file, "Timestamp,Sensor,Medicion,Valor").unwrap();
    }

    let app = Router::new()
        .route("/", get(pagina_principal))
        .route("/datos", post(recibir_datos))
        .route("/api/datos", get(obtener_csv));

    let direccion = format!("{}:{}", ip, puerto);
    let listener = tokio::net::TcpListener::bind(&direccion).await.unwrap();
    
    println!("\n Servidor web corriendo exitosamente en http://{}", direccion);
    println!("Presiona Ctrl+C para detenerlo.\n");
    
    axum::serve(listener, app).await.unwrap();
}


// POST /datos: Recibe la información de Python y la guarda
async fn recibir_datos(Json(payload): Json<DatosSensor>) -> String {
    let mut file = OpenOptions::new().append(true).open("data/datos.csv").unwrap();
    
    // Guardamos las 4 columnas
    writeln!(
        file, 
        "{},{},{},{}", 
        payload.timestamp, 
        payload.id_sensor, 
        payload.medicion, 
        payload.valor
    ).unwrap();
    
    //println!("Guardado: {} [{}] -> {}", payload.id_sensor, payload.medicion, payload.valor);
    format!("Datos de {} guardados exitosamente", payload.medicion)
}
// GET /: Entrega tu Dashboard en HTML
async fn pagina_principal() -> impl IntoResponse {
    let contenido = fs::read_to_string("public/index.html")
        .unwrap_or_else(|_| "<h1>Error: Archivo public/index.html no encontrado</h1>".to_string());
    Html(contenido)
}

// GET /api/datos: Permite que el Dashboard descargue el CSV para graficar
async fn obtener_csv() -> impl IntoResponse {
    fs::read_to_string("data/datos.csv").unwrap_or_default()
}
