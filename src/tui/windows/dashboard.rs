// src/tui/windows/dashboard.rs
use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Cell, Gauge, Paragraph, Row, Table},
    Frame,
};
use crossterm::event::{KeyCode, KeyEvent};
use super::super::app::App;

pub fn dibujar_pestaña_dashboard(f: &mut Frame, app: &App, area: Rect) {
    let main_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(5), // Resumen Sensores
            Constraint::Length(5), // Rendimiento
            Constraint::Min(5),    // Tabla Detalles
        ].as_ref())
        .split(area);

    // --- 1. SECCIÓN: RESUMEN DE SENSORES ---
    let txt_sensores = format!(
        "\n Nodos (Sensores) Registrados Activos: {} \n", 
        app.conocidas.len()
    );
    let panel_sensores = Paragraph::new(txt_sensores)
        .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
        .block(Block::default().title(" Estado de la Red IoT ").borders(Borders::ALL));
    f.render_widget(panel_sensores, main_chunks[0]);

    // --- 2. SECCIÓN: RENDIMIENTO DEL SERVIDOR ---
    let hw_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)].as_ref())
        .split(main_chunks[1]);

    let gauge_cpu = Gauge::default()
        .block(Block::default().title(" Uso de CPU ").borders(Borders::ALL))
        .gauge_style(Style::default().fg(Color::Green).bg(Color::DarkGray))
        .percent(app.uso_cpu.clamp(0, 100));
    f.render_widget(gauge_cpu, hw_chunks[0]);

    let gauge_ram = Gauge::default()
        .block(Block::default().title(" Uso de RAM ").borders(Borders::ALL))
        .gauge_style(Style::default().fg(Color::Yellow).bg(Color::DarkGray))
        .percent(app.uso_ram.clamp(0, 100));
    f.render_widget(gauge_ram, hw_chunks[1]);

    // --- 3. SECCIÓN: TABLA DE SENSORES CONECTADOS ---
    let mut rows = Vec::new();
    
    // Llenamos la tabla leyendo del archivo json (app.conocidas)
    for ip_info in &app.conocidas {
        rows.push(Row::new(vec![
            Cell::from(ip_info.ip.clone()),
            Cell::from(ip_info.nombre.clone()),
            Cell::from(ip_info.info.clone()).style(Style::default().fg(Color::Green)),
        ]));
    }

    let header = Row::new(vec!["IP Dispositivo", "Alias del Sensor", "Ubicación / Info"])
        .style(Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD))
        .bottom_margin(1);

    let tabla = Table::new(rows, [
        Constraint::Percentage(30), 
        Constraint::Percentage(40), 
        Constraint::Percentage(30), 
    ])
    .header(header)
    .block(Block::default().title(" Nodos IoT Reconocidos ").borders(Borders::ALL));

    f.render_widget(tabla, main_chunks[2]);
}

pub fn manejar_teclas_dashboard(_key: KeyEvent, _app: &mut App) {
    // Espacio reservado para futuras interacciones en el dashboard
}
