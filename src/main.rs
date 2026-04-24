mod server;

#[tokio::main]
async fn main() {
    println!("Iniciando servidor de datos...");
    server::iniciar_servidor().await;
}
