mod setup;
mod server;

use std::env;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 && args[1] == "config" {
        println!("Abriendo el Panel de Control...");
        if let Err(e) = setup::ejecutar_panel_control() {
            eprintln!("Ocurrió un error al cargar la interfaz TUI: {}", e);
        }
    } 
    else {
        println!("Arrancando el Servidor IoT de forma automática...");
        server::iniciar_servidor().await; 
    }
}
