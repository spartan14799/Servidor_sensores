use axum::{
    extract::{ConnectInfo, State, Json},
    response::{Html, IntoResponse},
    routing::{get, post},
    Router,
};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::collections::HashSet;
use serde::{Deserialize, Serialize};
use dotenvy::dotenv;
use std::env;

#[derive(Deserialize, Serialize, Debug)]
pub struct DatosSensor {
    pub id_sensor: String,
    pub medicion: String,
    pub valor: f64,
    pub timestamp: f64,
}

pub async fn iniciar_servidor(activos: Arc<Mutex<HashSet<String>>>) {
    let _ = dotenv();
    
    let ip = env::var("IP_SERVIDOR").unwrap_or_else(|_| "0.0.0.0".to_string());
    let puerto = env::var("PUERTO_SERVIDOR").unwrap_or_else(|_| "3000".to_string());

    let ruta_csv = "./data/datos.csv"; 
    
    if !std::path::Path::new(ruta_csv).exists() {
        let mut file = OpenOptions::new().create(true).write(true).open(ruta_csv).unwrap();
        writeln!(file, "Timestamp,Sensor,Medicion,Valor,IP_Origen").unwrap();
    }

    let app = Router::new()
        .route("/", get(pagina_principal))
        .route("/datos", post(recibir_datos))
        .route("/api/datos", get(obtener_csv))
        .with_state(activos);

    let direccion = format!("{}:{}", ip, puerto);
    let listener = tokio::net::TcpListener::bind(&direccion).await.expect("Error: Puerto 3000 ocupado");
    
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn recibir_datos(
    State(activos): State<Arc<Mutex<HashSet<String>>>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>, 
    Json(payload): Json<DatosSensor>
) -> String {
    let ip_cliente = addr.ip().to_string();
    activos.lock().unwrap().insert(ip_cliente.clone());

    let mut file = OpenOptions::new().append(true).open("./data/datos.csv").unwrap();
    writeln!(
        file, "{},{},{},{},{}", 
        payload.timestamp, payload.id_sensor, payload.medicion, payload.valor, ip_cliente
    ).unwrap();
    
    format!("OK desde {}", ip_cliente)
}

async fn pagina_principal() -> impl IntoResponse {
    // Buscamos el HTML en la raíz/public/index.html
    match fs::read_to_string("./public/index.html") {
        Ok(html) => Html(html),
        Err(_) => Html("<h1>404: No se encontró public/index.html</h1>".to_string()),
    }
}

async fn obtener_csv() -> impl IntoResponse {
    fs::read_to_string("./data/datos.csv").unwrap_or_default()
}
