// src/tui/windows/dashboard.rs
use ratatui::{
    layout::Rect,
    style::{Color, Style},
    widgets::{Block, Borders, Paragraph},
    Frame,
};
use crossterm::event::{KeyCode, KeyEvent};
use super::super::app::App; // Importación correcta

pub fn dibujar_pestaña_dashboard(f: &mut Frame, _app: &App, area: Rect) {
    let mensaje = " 🚀 Bienvenido al Dashboard Principal\n\n Aquí podrás ver estadísticas globales, estado del servidor y métricas en tiempo real.";
    
    let p = Paragraph::new(mensaje)
        .block(Block::default().title(" Dashboard ").borders(Borders::ALL))
        .style(Style::default().fg(Color::Green));
        
    f.render_widget(p, area);
}

pub fn manejar_teclas_dashboard(key: KeyEvent, _app: &mut App) {
    // Por ahora el dashboard es solo de lectura
    match key.code {
        KeyCode::Char('r') => {
            // Futuro: Recargar estadísticas
        }
        _ => {}
    }
}
