use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Cell, Gauge, Paragraph, Row, Table},
    Frame,
};
use crossterm::event::{KeyCode, KeyEvent};
use super::super::app::{App, InputMode};

pub fn dibujar_pestaña_dashboard(f: &mut Frame, app: &App, area: Rect) {
    let main_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(5), Constraint::Length(5), Constraint::Min(5)].as_ref())
        .split(area);

    let num_conectados = app.sensores_activos.lock().unwrap().len();

    let txt_sensores = format!("\n Dispositivos físicos conectados: {} \n", num_conectados);
    let panel_sensores = Paragraph::new(txt_sensores)
        .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
        .block(Block::default().title(" Estado de la Red IoT ").borders(Borders::ALL));
    f.render_widget(panel_sensores, main_chunks[0]);

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

    let activos = app.sensores_activos.lock().unwrap();
    let mut lista_ips: Vec<String> = activos.iter().cloned().collect();
    lista_ips.sort();

    let mut rows = Vec::new();
    
    for (i, ip) in lista_ips.iter().enumerate() {
        let mut nombre_mostrar = "Nuevo Dispositivo".to_string();
        let mut info_mostrar = "Enviando datos...".to_string();

        for conocida in &app.conocidas {
            if &conocida.ip == ip {
                nombre_mostrar = conocida.nombre.clone();
                info_mostrar = conocida.info.clone();
                break;
            }
        }

        let mut estilo_fila = Style::default();
        if i == app.dashboard_seleccion_indice {
            estilo_fila = estilo_fila.bg(Color::DarkGray).fg(Color::White).add_modifier(Modifier::BOLD);
        }

        rows.push(Row::new(vec![
            Cell::from(ip.clone()),
            Cell::from(nombre_mostrar),
            Cell::from(info_mostrar).style(Style::default().fg(Color::Green)),
        ]).style(estilo_fila));
    }

    if rows.is_empty() {
        rows.push(Row::new(vec![Cell::from("-"), Cell::from("Esperando conexión..."), Cell::from("-")]));
    }

    let header = Row::new(vec!["IP Origen (Real)", "Alias / Nombre", "Estado actual"])
        .style(Style::default().fg(Color::Magenta).add_modifier(Modifier::BOLD))
        .bottom_margin(1);

    let titulo_tabla = match app.input_mode {
        InputMode::EditingNombre => format!(" [EDITANDO] Nuevo nombre para {}: {}_ ", app.ip_en_edicion, app.input),
        _ => " Nodos IoT Transmitiendo AHORA (↑/↓ Navegar | 'e' Renombrar) ".to_string(),
    };

    let tabla = Table::new(rows, [Constraint::Percentage(30), Constraint::Percentage(40), Constraint::Percentage(30)])
        .header(header)
        .block(Block::default().title(titulo_tabla).borders(Borders::ALL).style(
            if let InputMode::EditingNombre = app.input_mode { Style::default().fg(Color::Yellow) } else { Style::default() }
        ));

    f.render_widget(tabla, main_chunks[2]);
}

pub fn manejar_teclas_dashboard(key: KeyEvent, app: &mut App) {
    match app.input_mode {
        InputMode::Normal => match key.code {
            KeyCode::Down => {
                let total = app.sensores_activos.lock().unwrap().len();
                if total > 0 && app.dashboard_seleccion_indice < total - 1 {
                    app.dashboard_seleccion_indice += 1;
                }
            }
            KeyCode::Up => {
                if app.dashboard_seleccion_indice > 0 {
                    app.dashboard_seleccion_indice -= 1;
                }
            }
            KeyCode::Char('e') => {
                let activos = app.sensores_activos.lock().unwrap();
                let mut lista_ips: Vec<String> = activos.iter().cloned().collect();
                lista_ips.sort();

                if app.dashboard_seleccion_indice < lista_ips.len() {
                    app.ip_en_edicion = lista_ips[app.dashboard_seleccion_indice].clone();
                    app.input.clear();
                    app.input_mode = InputMode::EditingNombre;
                }
            }
            _ => {}
        },
        InputMode::EditingNombre => match key.code {
            KeyCode::Enter => {
                let ip = app.ip_en_edicion.clone();
                let nuevo_nombre = app.input.clone();
                app.actualizar_nombre_conocida(ip, nuevo_nombre);
                
                app.input.clear();
                app.input_mode = InputMode::Normal;
            }
            KeyCode::Char(c) => app.input.push(c),
            KeyCode::Backspace => { app.input.pop(); },
            KeyCode::Esc => {
                app.input.clear();
                app.input_mode = InputMode::Normal;
            }
            _ => {}
        },
        _ => {}
    }
}
