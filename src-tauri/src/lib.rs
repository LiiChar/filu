mod commands;
mod convert;
mod media;
mod server;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_info,
            get_video_segment,
            get_video_poster,
            get_video_stream,
            transfer_vid,
            download_video,
            get_metadata,
            get_title,
            open_path,
            get_file_size,
            toggle_pin,
            get_current_process,
            file_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
