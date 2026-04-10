// src/tui/render.rs
use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::Line,
    widgets::{Block, Borders, Tabs},
    Frame,
};
use super::app::{App, PestañaActiva};

use super::windows::sensores::dibujar_pestaña_sensores;
use super::windows::dashboard::dibujar_pestaña_dashboard;

pub fn dibujar_interfaz(f: &mut Frame, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(3), // Menú de pestañas
            Constraint::Min(0),    // Contenido
        ].as_ref())
        .split(f.size());

    // 1. DIBUJAR PESTAÑAS
    let titulos = vec![
        Line::from(" [1] Dashboard "),
        Line::from(" [2] Gestión de Sensores (IPs) "),
        Line::from(" [3] Ajustes Servidor "),
    ];

    let indice = match app.pestana_actual {
        PestañaActiva::Dashboard => 0,
        PestañaActiva::Sensores => 1,
        PestañaActiva::Ajustes => 2,
    };

    let tabs = Tabs::new(titulos)
        .block(Block::default().borders(Borders::ALL).title(" Menú Principal "))
        .select(indice)
        .highlight_style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
        .divider(" | ");

    f.render_widget(tabs, chunks[0]);

    // 2. DIBUJAR CONTENIDO
    match app.pestana_actual {
        PestañaActiva::Sensores => dibujar_pestaña_sensores(f, app, chunks[1]),
        PestañaActiva::Dashboard => dibujar_pestaña_dashboard(f, app, chunks[1]),
        _ => {} 
    }
}
