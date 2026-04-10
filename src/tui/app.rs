// src/tui/app.rs
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize, Clone)]
pub struct InfoIp {
    pub ip: String,
    pub nombre: String,
    pub info: String,
}

pub enum InputMode {
    Normal,
    EditingIp,
    EditingNombre,
    EditingInfo,
}

pub struct App {
    pub input_mode: InputMode,
    pub input: String,
    pub baneadas: Vec<InfoIp>,
    pub conocidas: Vec<InfoIp>,
    pub seleccion_indice: usize, 
}

impl App {
    pub fn new() -> App {
        let mut app = App {
            input_mode: InputMode::Normal,
            input: String::new(),
            baneadas: Vec::new(),
            conocidas: Vec::new(),
            seleccion_indice: 0,
        };
        app.cargar_de_json();
        app
    }

    pub fn guardar_a_json(&self) {
        let data = serde_json::json!({
            "baneadas": self.baneadas,
            "conocidas": self.conocidas,
        });
        fs::write("config.json", data.to_string()).expect("No se pudo guardar el JSON");
    }

    fn cargar_de_json(&mut self) {
        if let Ok(contenido) = fs::read_to_string("config.json") {
            let v: serde_json::Value = serde_json::from_str(&contenido).unwrap_or_default();
            if let Some(b) = v.get("baneadas") {
                self.baneadas = serde_json::from_value(b.clone()).unwrap_or_default();
            }
            if let Some(c) = v.get("conocidas") {
                self.conocidas = serde_json::from_value(c.clone()).unwrap_or_default();
            }
        }
    }

    pub fn agregar_ip_baneada(&mut self) {
        if !self.input.is_empty() {
            self.baneadas.push(InfoIp {
                ip: self.input.clone(),
                nombre: "Nueva IP".into(),
                info: "Sin descripción".into(),
            });
            self.input.clear();
            self.guardar_a_json();
        }
        self.input_mode = InputMode::Normal;
    }
}
