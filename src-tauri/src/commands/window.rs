use tauri::{WebviewWindow};

#[tauri::command]
pub async fn toggle_pin(window: WebviewWindow) -> Result<bool, String> {
    let is_pinned = window.is_always_on_top().map_err(|e| e.to_string())?;
    window
        .set_always_on_top(!is_pinned)
        .map_err(|e| e.to_string())?;
    Ok(is_pinned)
}