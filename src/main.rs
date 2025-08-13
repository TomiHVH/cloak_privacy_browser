use anyhow::{Result, Context};
use tao::{
    dpi::{LogicalPosition, LogicalSize},
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::{WebContext, WebViewBuilder};
use serde_json::json;
use directories::ProjectDirs;
use std::path::PathBuf;
use std::fs;

// Include the JavaScript UI code from external file
const UI_JS: &str = include_str!("ui.js");

fn create_window(event_loop: &EventLoop<()>) -> Result<tao::window::Window> {
    // Try to size the window to the user's primary monitor resolution
    let (width, height) = if let Some(monitor) = event_loop.primary_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size(); // physical pixels
        let logical: LogicalSize<f64> = size.to_logical(scale);
        (logical.width, logical.height)
    } else {
        // Fallback if monitor cannot be determined
        (1200.0, 800.0)
    };

    let window = WindowBuilder::new()
        .with_title("cloak_browser")
        .with_inner_size(LogicalSize::new(width, height))
        .with_position(LogicalPosition::new(0.0, 0.0))
        .with_resizable(true)
        .build(event_loop)
        .context("Failed to create window")?;

    Ok(window)
}

fn get_data_directory() -> Result<PathBuf> {
    let proj_dirs = ProjectDirs::from("com", "cloak", "browser")
        .context("Failed to get project directories")?;
    
    let data_dir = proj_dirs.data_dir();
    fs::create_dir_all(data_dir)?;
    
    Ok(data_dir.to_path_buf())
}

fn create_bootstrap_script(profile_file: &PathBuf, start_url: &str) -> Result<String> {
    // Build default profile
    let default_profile = serde_json::json!({
        "tabs": [{"url": start_url, "title": "New Tab"}],
        "active": 0,
        "bookmarks": [],
        "history": []
    });

    // Load profile from disk if present
    let profile_value = match std::fs::read_to_string(profile_file) {
        Ok(s) => serde_json::from_str::<serde_json::Value>(&s).unwrap_or(default_profile),
        Err(_) => default_profile,
    };

    let profile_literal = serde_json::to_string(&profile_value).unwrap_or("{}".into());
    let script = format!(
        r#"
        // Bootstrap for cloak_browser
        try {{
          window.__CB_INITIAL__ = {};
        }} catch(_e) {{}}
        "#,
        profile_literal,
    );
    Ok(script)
}

fn validate_ipc_command(cmd: &str, _data: &serde_json::Value) -> bool {
    match cmd {
        "tabs_save" | "tabs_load" => true,
        _ => false,
    }
}

fn main() -> Result<()> {
    // Get data directory for storing tabs and settings
    let data_dir = get_data_directory()?;
    let profile_file = data_dir.join("profile.json");
    
    // Create bootstrap script
    let start_url = "about:blank";
    let bootstrap_script = create_bootstrap_script(&profile_file, start_url)?;
    
    // Create event loop and window
    let event_loop = EventLoop::new();
    let window = create_window(&event_loop)?;
    
    // Create web context - this is required for the webview to function
    // Ensure a stable WebView2 user data folder under LOCALAPPDATA so cookies/sessions persist
    let proj_dirs_local = ProjectDirs::from("com", "cloak", "browser")
        .context("Failed to get project directories for Local cache")?;
    let wv2_dir = proj_dirs_local.cache_dir().join("wv2_profile");
    let _ = std::fs::create_dir_all(&wv2_dir);
    std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &wv2_dir);
    let mut web_context = WebContext::new(Some(data_dir.clone()));
    
    // Build and create the webview
    let _webview = WebViewBuilder::new(&window)
        .with_url(start_url)
        .with_user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0")
        .with_devtools(true)
        .with_initialization_script(&bootstrap_script)
        .with_initialization_script(UI_JS)
        .with_web_context(&mut web_context)
        .with_ipc_handler(move |payload| {
            // Expect JSON string payload with { cmd, payload }
            let parsed: Result<serde_json::Value, _> = serde_json::from_str(payload.body());
            if let Ok(v) = parsed {
                if let Some(cmd) = v.get("cmd").and_then(|c| c.as_str()) {
                    match cmd {
                        "profile_save" => {
                            if let Some(profile) = v.get("payload") {
                                if let Some(parent) = profile_file.parent() { let _ = std::fs::create_dir_all(parent); }
                                let _ = std::fs::write(&profile_file, profile.to_string());
                            }
                        }
                        "download_start" => {
                            if let Some(p) = v.get("payload").cloned() {
                                let url = p.get("url").and_then(|u| u.as_str()).unwrap_or("").to_string();
                                let file = p.get("file").and_then(|u| u.as_str()).unwrap_or("download").to_string();
                                 // Choose a save location with a native dialog
                                 let save_path = match rfd::FileDialog::new().set_file_name(file).save_file() {
                                     Some(path) => path,
                                     None => return,
                                 };
                                 // Kick off a blocking download on a new thread
                                std::thread::spawn(move || {
                                     let res = (|| -> anyhow::Result<()> {
                                        let resp = reqwest::blocking::get(&url)?;
                                         let mut file = std::fs::File::create(&save_path)?;
                                         let mut src = std::io::Cursor::new(resp.bytes()?);
                                         std::io::copy(&mut src, &mut file)?;
                                         Ok(())
                                     })();
                                     // Optionally: write a small sidecar json with status
                                     let _ = res;
                                 });
                             }
                         }
                        _ => {}
                    }
                }
            }
        })
        .build()
        .context("Failed to create webview")?;
    
    // Start the event loop
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        match event {
            Event::WindowEvent { event: WindowEvent::CloseRequested, .. } => *control_flow = ControlFlow::Exit,
            _ => {}
        }
    });
}

