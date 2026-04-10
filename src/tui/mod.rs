pub mod app;
pub mod render;

use crossterm::{
    event::{self, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{backend::{Backend, CrosstermBackend}, Terminal};
use std::{io, time::Duration};

use app::{App, InputMode};
use render::dibujar_interfaz;

pub fn ejecutar_panel_control() -> Result<(), io::Error> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new();
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
        terminal.draw(|f| dibujar_interfaz(f, app))?;

        if event::poll(Duration::from_millis(250))? {
            if let Event::Key(key) = event::read()? {
                match app.input_mode {
                        // --- MODO NAVEGACIÓN ---
                    InputMode::Normal => match key.code {
                        // Flecha Arriba: Solo si la lista no está vacía y no estamos en el primer elemento
                        KeyCode::Up => {
                            if !app.baneadas.is_empty() && app.seleccion_indice > 0 {
                                app.seleccion_indice -= 1;
                            }
                        }
                        // Flecha Abajo: Solo si no estamos en el último elemento
                        KeyCode::Down => {
                            if !app.baneadas.is_empty() && app.seleccion_indice < app.baneadas.len() - 1 {
                                app.seleccion_indice += 1;
                            }
                        }
                        // [b] para Banear: Cambia a modo escribir IP
                        KeyCode::Char('b') => {
                            app.input_mode = InputMode::EditingIp;
                            app.input.clear();
                        }
                        // [e] para Editar Nombre: Solo si hay una IP seleccionada
                        KeyCode::Char('e') => {
                            if !app.baneadas.is_empty() {
                                app.input_mode = InputMode::EditingNombre;
                                app.input = app.baneadas[app.seleccion_indice].nombre.clone();
                            }
                        }
                        // [i] para Editar Info: Solo si hay una IP seleccionada
                        KeyCode::Char('i') => {
                            if !app.baneadas.is_empty() {
                                app.input_mode = InputMode::EditingInfo;
                                app.input = app.baneadas[app.seleccion_indice].info.clone();
                            }
                        }
                        // [q] para Salir
                        KeyCode::Char('q') => return Ok(()),
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
        }
    }
}
