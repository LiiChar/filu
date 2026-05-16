use std::fs;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn open_path(app_handle: AppHandle, path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("Path is empty".into());
    }

    let _ = app_handle.opener().open_path(path, None::<&str>);

    Ok(())
}

#[tauri::command]
pub fn get_file_size(path: String) -> Result<u64, String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    Ok(metadata.len())
}

#[tauri::command]
pub async fn file_server() -> Result<String, ()> {
    crate::server::run_file_server().await.map_err(|_| ())?;
    Ok("ok".to_string())
}
