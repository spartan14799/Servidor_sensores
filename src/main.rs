mod server;
mod tui;

use std::env;
use std::collections::HashSet;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let memoria_activos = Arc::new(Mutex::new(HashSet::new()));

    if args.len() > 1 && args[1] == "config" {
        let activos_para_server = Arc::clone(&memoria_activos);
        
        tokio::spawn(async move {
            server::iniciar_servidor(activos_para_server).await;
        });

        if let Err(e) = tui::ejecutar_panel_control(memoria_activos) {
            eprintln!("Error en TUI: {}", e);
        }
    } else {
        println!("Iniciando servidor en modo producción...");
        server::iniciar_servidor(memoria_activos).await;
    }
}
