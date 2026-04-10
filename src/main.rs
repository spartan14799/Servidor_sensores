// src/main.rs

mod server; 
mod tui;    

use std::env;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 && args[1] == "config" {
        if let Err(e) = tui::ejecutar_panel_control() {
            eprintln!("Ocurrió un error fatal en la interfaz TUI: {}", e);
        }
        println!("Saliendo del panel de configuración.");
    } 
    else {
        println!("Iniciando el motor web de Axum...");
        server::iniciar_servidor().await; 
    }
}
