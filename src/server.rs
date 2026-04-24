use axum::{
    extract::{ConnectInfo, State, Json},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool, FromRow};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::services::ServeDir;
use dotenvy::dotenv;
use std::env;

#[derive(Deserialize, Debug)]
pub struct DatosSensor {
    pub id_sensor: String,
    pub medicion: String,
    pub valor: f64,
    pub timestamp: f64,
}

#[derive(Serialize, FromRow)]
pub struct RegistroDb {
    pub timestamp: f64,
    pub sensor: String,
    pub medicion: String,
    pub valor: f64,
    pub ip_origen: String,
}

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

pub async fn iniciar_servidor() {
    let _ = dotenv();
    let ip = env::var("IP_SERVIDOR").unwrap_or_else(|_| "0.0.0.0".to_string());
    let puerto = env::var("PUERTO_SERVIDOR").unwrap_or_else(|_| "3000".to_string());

    // Crear y conectar a la base de datos SQLite
    let db_url = "sqlite://data/datos.db?mode=rwc";
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url).await.expect("Error conectando a la base de datos");

    sqlx::query("
        CREATE TABLE IF NOT EXISTS mediciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL,
            sensor TEXT NOT NULL,
            medicion TEXT NOT NULL,
            valor REAL NOT NULL,
            ip_origen TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sensor ON mediciones(sensor, medicion);
    ")
    .execute(&pool).await.unwrap();

    let estado = AppState { db: pool };

    let app = Router::new()
        .route("/datos", post(recibir_datos))
        .route("/api/datos", get(obtener_datos_db))
        .fallback_service(ServeDir::new("public")) 
        .with_state(estado); 

    let direccion = format!("{}:{}", ip, puerto);
    println!("Servidor corriendo en http://{}", direccion);
    let listener = tokio::net::TcpListener::bind(&direccion).await.unwrap();
    
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn recibir_datos(
    State(estado): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>, 
    Json(payload): Json<DatosSensor>
) -> String {
    let ip_cliente = addr.ip().to_string();

    let _ = sqlx::query("INSERT INTO mediciones (timestamp, sensor, medicion, valor, ip_origen) VALUES (?, ?, ?, ?, ?)")
        .bind(payload.timestamp)
        .bind(&payload.id_sensor)
        .bind(&payload.medicion)
        .bind(payload.valor)
        .bind(&ip_cliente)
        .execute(&estado.db).await;
    
    format!("OK guardado en DB desde {}", ip_cliente)
}

// --- RUTA GET: Enviar datos a la página Web ---
async fn obtener_datos_db(State(estado): State<AppState>) -> impl IntoResponse {
    let query = "SELECT CAST(timestamp AS REAL) as timestamp, sensor, medicion, CAST(valor AS REAL) as valor, ip_origen FROM mediciones ORDER BY timestamp ASC LIMIT 5000";

    match sqlx::query_as::<_, RegistroDb>(query)
        .fetch_all(&estado.db).await 
    {
        Ok(registros) => Json(registros).into_response(),
        Err(e) => {
            eprintln!("Error SQL al leer la base de datos: {:?}", e);
            "[]".into_response()
        }
    }
}
