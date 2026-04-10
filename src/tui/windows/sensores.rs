use crossterm::event::{KeyCode, KeyEvent};
use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};
use crate::tui::app::{App, InputMode};

pub fn dibujar_pestaña_sensores(f: &mut Frame, app: &App, area: Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3), // Cabecera de controles
            Constraint::Min(10),   // Listas
            Constraint::Length(3), // Input
        ].as_ref())
        .split(area);

    // --- CABECERA ---
    let header = Paragraph::new(" [↑↓] Navegar | [b] Banear | [e] Editar Nombre | [i] Editar Info ")
        .block(Block::default().borders(Borders::ALL));
    f.render_widget(header, chunks[0]);

    // --- CUERPO (Listas) ---
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

    // --- BARRA DE INPUT ---
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

pub fn manejar_teclas_sensores(key: KeyEvent, app: &mut App) {
    match app.input_mode {
        // --- MODO NAVEGACIÓN ---
        InputMode::Normal => match key.code {
            KeyCode::Up => {
                if !app.baneadas.is_empty() && app.seleccion_indice > 0 {
                    app.seleccion_indice -= 1;
                }
            }
            KeyCode::Down => {
                if !app.baneadas.is_empty() && app.seleccion_indice < app.baneadas.len() - 1 {
                    app.seleccion_indice += 1;
                }
            }
            KeyCode::Char('b') => {
                app.input_mode = InputMode::EditingIp;
                app.input.clear();
            }
            KeyCode::Char('e') => {
                if !app.baneadas.is_empty() {
                    app.input_mode = InputMode::EditingNombre;
                    app.input = app.baneadas[app.seleccion_indice].nombre.clone();
                }
            }
            KeyCode::Char('i') => {
                if !app.baneadas.is_empty() {
                    app.input_mode = InputMode::EditingInfo;
                    app.input = app.baneadas[app.seleccion_indice].info.clone();
                }
            }
            // Nota: No manejamos 'q' ni números de pestañas aquí, 
            // porque eso pertenece a la navegación global en mod.rs
            _ => {}
        },

        // --- MODO ESCRIBIR IP ---
        InputMode::EditingIp => match key.code {
            KeyCode::Enter => app.agregar_ip_baneada(),
            KeyCode::Char(c) => app.input.push(c),
            KeyCode::Backspace => { app.input.pop(); }
            KeyCode::Esc => app.input_mode = InputMode::Normal,
            _ => {}
        },

        // --- MODO EDITAR NOMBRE ---
        InputMode::EditingNombre => match key.code {
            KeyCode::Enter => {
                if !app.baneadas.is_empty() {
                    app.baneadas[app.seleccion_indice].nombre = app.input.clone();
                    app.input.clear();
                    app.input_mode = InputMode::Normal;
                    app.guardar_a_json();
                }
            }
            KeyCode::Char(c) => app.input.push(c),
            KeyCode::Backspace => { app.input.pop(); }
            KeyCode::Esc => app.input_mode = InputMode::Normal,
            _ => {}
        },

        // --- MODO EDITAR INFO ---
        InputMode::EditingInfo => match key.code {
            KeyCode::Enter => {
                if !app.baneadas.is_empty() {
                    app.baneadas[app.seleccion_indice].info = app.input.clone();
                    app.input.clear();
                    app.input_mode = InputMode::Normal;
                    app.guardar_a_json();
                }
            }
            KeyCode::Char(c) => app.input.push(c),
            KeyCode::Backspace => { app.input.pop(); }
            KeyCode::Esc => app.input_mode = InputMode::Normal,
            _ => {}
        }
    }
}
