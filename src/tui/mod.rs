pub mod app;
pub mod render;
pub mod windows;

use crossterm::{
    event::{self, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{backend::{Backend, CrosstermBackend}, Terminal};
use std::{io, time::Duration};

// Nuevas importaciones:
use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use app::{App, InputMode, PestañaActiva};
use render::dibujar_interfaz;

pub fn ejecutar_panel_control(activos: Arc<Mutex<HashSet<String>>>) -> Result<(), io::Error> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new(activos);
    let res = run_app(&mut terminal, &mut app);

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("Error en la interfaz TUI: {:?}", err);
    }

    Ok(())
}

fn run_app<B: Backend>(terminal: &mut Terminal<B>, app: &mut App) -> io::Result<()> {
    loop {
        app.actualizar_metricas();
        terminal.draw(|f| dibujar_interfaz(f, app))?;

        if event::poll(Duration::from_millis(250))? {
            if let Event::Key(key) = event::read()? {
                if let InputMode::Normal = app.input_mode {
                    match key.code {
                        KeyCode::Char('q') | KeyCode::Esc => return Ok(()),
                        KeyCode::Char('1') => app.pestana_actual = PestañaActiva::Dashboard,
                        KeyCode::Char('2') => app.pestana_actual = PestañaActiva::Sensores,
                        KeyCode::Char('3') => app.pestana_actual = PestañaActiva::Ajustes,
                        _ => {}
                    }
                }

                match app.pestana_actual {
                    PestañaActiva::Sensores => windows::sensores::manejar_teclas_sensores(key, app),
                    PestañaActiva::Dashboard => windows::dashboard::manejar_teclas_dashboard(key, app),
                    _ => {}
                }
            }
        }
    }
}
