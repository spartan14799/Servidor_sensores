// src/tui/app.rs
use serde::{Deserialize, Serialize};
use std::fs;
use sysinfo::System;

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

#[derive(Copy, Clone, PartialEq)]
pub enum PestañaActiva {
    Dashboard,
    Sensores,
    Ajustes,
}

pub struct App {
    pub pestana_actual: PestañaActiva,
    pub input_mode: InputMode,
    pub input: String,
    pub baneadas: Vec<InfoIp>,
    pub conocidas: Vec<InfoIp>,
    pub seleccion_indice: usize, 
    pub sistema: System,
    pub uso_cpu: u16,
    pub uso_ram: u16,
}

impl App {
    pub fn new() -> App {
        let mut sistema = System::new_all();
        sistema.refresh_all();
        let mut app = App {
            pestana_actual: PestañaActiva::Dashboard,
            input_mode: InputMode::Normal,
            input: String::new(),
            baneadas: Vec::new(),
            conocidas: Vec::new(),
            seleccion_indice: 0,
            sistema,
            uso_cpu: 0,
            uso_ram: 0,
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

    pub fn cargar_de_json(&mut self) {
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
                nombre: "Desconocido".to_string(),
                info: "Sin descripción".to_string(),
            });
            self.input.clear();
            self.input_mode = InputMode::Normal;
            self.guardar_a_json();
        }
    }
    pub fn actualizar_metricas(&mut self) {
        self.sistema.refresh_cpu_usage();
        self.sistema.refresh_memory();

        // Calcular CPU global
        let uso_total_cpu: f32 = self.sistema.cpus().iter().map(|cpu| cpu.cpu_usage()).sum();
        let cpu_promedio = uso_total_cpu / self.sistema.cpus().len() as f32;
        self.uso_cpu = cpu_promedio.round() as u16;

        // Calcular RAM
        let ram_total = self.sistema.total_memory() as f64;
        let ram_usada = self.sistema.used_memory() as f64;
        self.uso_ram = ((ram_usada / ram_total) * 100.0).round() as u16;

    }
}
