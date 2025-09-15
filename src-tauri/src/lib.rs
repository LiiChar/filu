mod media;

use media::get_media_tags;
use std::env;

#[tauri::command]
fn get_info(path: &str) -> Result<Vec<(String, String)>, String> {
    get_media_tags(path.to_string())
}

#[tauri::command]
async fn transfer_vid() -> String {
    let args: Vec<String> = env::args().collect();
    if args.len() == 2 {
        let path: String = args[1].clone();
        // let vid_content: Vec<u8> = fs::read(path).expect("Should have read video file");
        // let vid_data: String = general_purpose::STANDARD.encode(&vid_content);
        return path;
    } else {
        "Faulty arguments".into()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_info, transfer_vid])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
