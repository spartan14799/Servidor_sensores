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
    // Dividimos la pantalla en 3: Visitantes (arriba), Rendimiento (medio), Sensores (abajo)
    let main_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(5), // Visitantes
            Constraint::Length(5), // Rendimiento
            Constraint::Min(5),    // Tabla Sensores
        ].as_ref())
        .split(area);

    // --- 1. SECCIÓN: VISITANTES ---
    let txt_visitantes = format!(
        "\n Conexiones activas en index.html: {} usuarios \n", 
        app.visitantes_activos
    );
    let panel_visitantes = Paragraph::new(txt_visitantes)
        .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
        .block(Block::default().title(" Tráfico Web ").borders(Borders::ALL));
    f.render_widget(panel_visitantes, main_chunks[0]);

    // --- 2. SECCIÓN: RENDIMIENTO DEL SERVIDOR ---
    // Dividimos la zona del medio en 2 (Izquierda CPU, Derecha RAM)
    let hw_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)].as_ref())
        .split(main_chunks[1]);

    // Barra de CPU
    let gauge_cpu = Gauge::default()
        .block(Block::default().title(" Uso de CPU ").borders(Borders::ALL))
        .gauge_style(Style::default().fg(Color::Green).bg(Color::DarkGray))
        .percent(app.uso_cpu.clamp(0, 100)); // clamp asegura que no pase de 100%
    f.render_widget(gauge_cpu, hw_chunks[0]);

    // Barra de RAM
    let gauge_ram = Gauge::default()
        .block(Block::default().title(" Uso de RAM ").borders(Borders::ALL))
        .gauge_style(Style::default().fg(Color::Yellow).bg(Color::DarkGray))
        .percent(app.uso_ram.clamp(0, 100));
    f.render_widget(gauge_ram, hw_chunks[1]);

    // --- 3. SECCIÓN: TABLA DE SENSORES CONECTADOS ---
    // Convertimos nuestra lista de IPs 'conocidas' en filas de la tabla
    let mut rows = Vec::new();
    for ip_info in &app.conocidas {
        rows.push(Row::new(vec![
            Cell::from(ip_info.ip.clone()),
            Cell::from(ip_info.nombre.clone()),
            Cell::from(ip_info.info.clone()).style(Style::default().fg(Color::Green)),
        ]));
    }

    // Cabecera de la tabla
    let header = Row::new(vec!["IP Dispositivo", "Nombre / Tipo", "Estado de Conexión"])
        .style(Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD))
        .bottom_margin(1); // Espacio bajo el título

    // Construimos la tabla final
    let tabla = Table::new(rows, [
        Constraint::Percentage(30), // Ancho Columna 1
        Constraint::Percentage(40), // Ancho Columna 2
        Constraint::Percentage(30), // Ancho Columna 3
    ])
    .header(header)
    .block(Block::default().title(" Sensores Conectados Activos ").borders(Borders::ALL));

    f.render_widget(tabla, main_chunks[2]);
}

pub fn manejar_teclas_dashboard(_key: KeyEvent, _app: &mut App) {
    // Si más adelante quieres añadir controles al dashboard (ej. reiniciar servidor web con 'r'), iría aquí.
}
