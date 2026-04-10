use axum::{
    routing::{get, post},
    Router, Json, response::{Html, IntoResponse},
    extract::{State, ConnectInfo}, // <-- NUEVO: Añadimos ConnectInfo
};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::env;
use dotenvy::dotenv;

use std::collections::HashSet;
use std::sync::{Arc, Mutex};
use std::net::SocketAddr;

#[derive(Deserialize, Serialize, Debug)]
struct DatosSensor {
    id_sensor: String,
    medicion: String,
    valor: f64,
    timestamp: f64,
}

pub async fn iniciar_servidor(activos: Arc<Mutex<HashSet<String>>>) {
    let _ = dotenv();
    
    let ip = env::var("IP_SERVIDOR").unwrap_or_else(|_| "0.0.0.0".to_string());
    let puerto = env::var("PUERTO_SERVIDOR").unwrap_or_else(|_| "3000".to_string());
    
    if !Path::new("data").exists() { fs::create_dir_all("data").unwrap(); }
    if !Path::new("data/datos.csv").exists() {
        let mut file = OpenOptions::new().create(true).write(true).open("data/datos.csv").unwrap();
        writeln!(file, "Timestamp,Sensor,Medicion,Valor,IP_Origen").unwrap(); // Añadimos columna IP
    }

    let app = Router::new()
        .route("/", get(pagina_principal))
        .route("/datos", post(recibir_datos))
        .route("/api/datos", get(obtener_csv))
        .with_state(activos);

    let direccion = format!("{}:{}", ip, puerto);
    let listener = tokio::net::TcpListener::bind(&direccion).await.unwrap();
    
    
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn recibir_datos(
    State(activos): State<Arc<Mutex<HashSet<String>>>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>, 
    Json(payload): Json<DatosSensor>
) -> String {
    let ip_cliente = addr.ip().to_string();

    activos.lock().unwrap().insert(ip_cliente.clone());

    let mut file = OpenOptions::new().append(true).open("data/datos.csv").unwrap();
    
    writeln!(
        file, "{},{},{},{},{}", 
        payload.timestamp, payload.id_sensor, payload.medicion, payload.valor, ip_cliente
    ).unwrap();
    
    format!("Datos recibidos desde IP: {}", ip_cliente)
}

async fn pagina_principal() -> impl IntoResponse {
    let contenido = fs::read_to_string("public/index.html").unwrap_or_else(|_| "<h1>Error</h1>".to_string());
    Html(contenido)
}

async fn obtener_csv() -> impl IntoResponse {
    fs::read_to_string("data/datos.csv").unwrap_or_default()
}
