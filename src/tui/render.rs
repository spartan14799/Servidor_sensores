// src/tui/render.rs
use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};
use super::app::{App, InputMode};

pub fn dibujar_interfaz(f: &mut Frame, app: &App) {
    // Dividimos la pantalla en 3 zonas verticales
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .margin(1)
        .constraints([
            Constraint::Length(3), // 0: Cabecera
            Constraint::Min(10),   // 1: Cuerpo (Listas)
            Constraint::Length(3), // 2: Input de texto
        ].as_ref())
        .split(f.size());

    // --- 1. CABECERA ---
    let header = Paragraph::new(" [↑↓] Navegar | [b] Banear | [e] Editar Nombre | [i] Editar Info | [q] Salir ")
        .block(Block::default().borders(Borders::ALL).title(" Panel de Control IoT "));
    f.render_widget(header, chunks[0]);

    // --- 2. CUERPO (Aquí estaba el error) ---
    let body_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)].as_ref())
        .split(chunks[1]);

    // Renderizar Lista de Baneadas (Izquierda)
    let items: Vec<ListItem> = app.baneadas.iter().enumerate().map(|(i, ip_info)| {
        let mut style = Style::default().fg(Color::Red);
        if !app.baneadas.is_empty() && i == app.seleccion_indice {
            style = Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD);
        }
        ListItem::new(format!("{} - {}", ip_info.ip, ip_info.nombre)).style(style)
    }).collect();

    let list = List::new(items)
        .block(Block::default().title(" IPs Baneadas ").borders(Borders::ALL));
    f.render_widget(list, body_chunks[0]);

    // Renderizar Detalles (Derecha) con protección de lista vacía
    if !app.baneadas.is_empty() {
        if let Some(sel) = app.baneadas.get(app.seleccion_indice) {
            let detalles = format!(
                "\n IP: {}\n\n Nombre: {}\n\n Descripción: {}\n", 
                sel.ip, sel.nombre, sel.info
            );
            let p = Paragraph::new(detalles)
                .block(Block::default().title(" Detalles Seleccionado ").borders(Borders::ALL))
                .style(Style::default().fg(Color::Cyan));
            f.render_widget(p, body_chunks[1]);
        }
    } else {
        let p = Paragraph::new("\n No hay IPs bloqueadas.\n Presiona 'b' para agregar una.")
            .block(Block::default().title(" Detalles ").borders(Borders::ALL))
            .style(Style::default().fg(Color::DarkGray));
        f.render_widget(p, body_chunks[1]);
    }

    // --- 3. BARRA DE INPUT ---
    let label = match app.input_mode {
        InputMode::Normal => " MODO: Navegación ",
        InputMode::EditingIp => " NUEVA IP (Enter para guardar): ",
        InputMode::EditingNombre => " EDITANDO NOMBRE: ",
        InputMode::EditingInfo => " EDITANDO DESCRIPCIÓN: ",
    };

    let input_p = Paragraph::new(app.input.as_str())
        .style(Style::default().fg(Color::Yellow))
        .block(Block::default().borders(Borders::ALL).title(label));
    f.render_widget(input_p, chunks[2]);
}
