// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use tauri::{Manager, State};
use tokio::sync::broadcast;

mod screen_capture;
mod webrtc_client;
mod signaling;

use screen_capture::ScreenCapture;
use webrtc_client::WebRTCClient;
use signaling::SignalingClient;

#[derive(Debug, Clone)]
pub struct AppState {
    pub screen_capture: Arc<Mutex<Option<ScreenCapture>>>,
    pub webrtc_client: Arc<Mutex<Option<WebRTCClient>>>,
    pub signaling_client: Arc<Mutex<Option<SignalingClient>>>,
    pub is_sharing: Arc<Mutex<bool>>,
}

#[tauri::command]
async fn start_screen_share(
    session_id: String,
    user_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    println!("🖥️ Starting screen share for session: {}", session_id);

    // Initialize screen capture
    let mut screen_capture = ScreenCapture::new().map_err(|e| e.to_string())?;

    // Initialize WebRTC client
    let webrtc_client = WebRTCClient::new().await.map_err(|e| e.to_string())?;

    // Initialize signaling client
    let signaling_client = SignalingClient::new("ws://localhost:3001/signaling")
        .await
        .map_err(|e| e.to_string())?;

    // Store in state
    *state.screen_capture.lock().unwrap() = Some(screen_capture);
    *state.webrtc_client.lock().unwrap() = Some(webrtc_client);
    *state.signaling_client.lock().unwrap() = Some(signaling_client);
    *state.is_sharing.lock().unwrap() = true;

    // Join session as host
    if let Some(signaling) = state.signaling_client.lock().unwrap().as_mut() {
        signaling.join_session(&session_id, &user_id, "host").await
            .map_err(|e| e.to_string())?;
    }

    println!("✅ Screen share started successfully");
    Ok("Screen share started".to_string())
}

#[tauri::command]
async fn stop_screen_share(state: State<'_, AppState>) -> Result<String, String> {
    println!("🛑 Stopping screen share");

    *state.is_sharing.lock().unwrap() = false;
    *state.screen_capture.lock().unwrap() = None;
    *state.webrtc_client.lock().unwrap() = None;
    *state.signaling_client.lock().unwrap() = None;

    println!("✅ Screen share stopped");
    Ok("Screen share stopped".to_string())
}

#[tauri::command]
async fn get_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let is_sharing = *state.is_sharing.lock().unwrap();

    Ok(serde_json::json!({
        "is_sharing": is_sharing,
        "has_screen_capture": state.screen_capture.lock().unwrap().is_some(),
        "has_webrtc": state.webrtc_client.lock().unwrap().is_some(),
        "has_signaling": state.signaling_client.lock().unwrap().is_some(),
    }))
}

#[tauri::command]
async fn generate_session_id() -> Result<String, String> {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const SESSION_ID_LEN: usize = 8;

    let mut rng = rand::thread_rng();
    let session_id: String = (0..SESSION_ID_LEN)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();

    Ok(session_id)
}

fn main() {
    let app_state = AppState {
        screen_capture: Arc::new(Mutex::new(None)),
        webrtc_client: Arc::new(Mutex::new(None)),
        signaling_client: Arc::new(Mutex::new(None)),
        is_sharing: Arc::new(Mutex::new(false)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            start_screen_share,
            stop_screen_share,
            get_status,
            generate_session_id
        ])
        .setup(|app| {
            println!("🚀 ScreenShare Host Agent started");

            // Create system tray
            let tray_menu = tauri::SystemTrayMenu::new()
                .add_item(tauri::CustomMenuItem::new("show", "Show"))
                .add_separator()
                .add_item(tauri::CustomMenuItem::new("quit", "Quit"));

            let system_tray = tauri::SystemTray::new().with_menu(tray_menu);

            app.set_system_tray(system_tray).expect("Failed to create system tray");

            Ok(())
        })
        .on_system_tray_event(|app, event| match event {
            tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}