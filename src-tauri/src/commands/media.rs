use base64::engine::general_purpose;
use base64::Engine;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use tempfile::Builder;

use crate::convert::convert_segment;
use crate::media::get_media_tags;

#[tauri::command]
pub fn get_info(path: &str) -> Result<Vec<(String, String)>, String> {
    get_media_tags(path.to_string())
}

#[tauri::command]
pub fn get_video_segment(input_path: String, start: u64) -> String {
    println!("input_path: {}, start: {}", input_path, start);
    let segment_file = convert_segment(&input_path, start);
    segment_file.to_str().unwrap().to_string()
}

#[tauri::command]
pub async fn get_video_poster(app_handle: AppHandle, path: String) -> Result<String, String> {
    let project_dir = std::env::current_dir()
        .map_err(|e| format!("Ошибка получения текущей директории: {}", e))?;

    let ffmpeg_path = project_dir.join("bin\\ffmpeg.exe");

    if !ffmpeg_path.exists() {
        return Err("FFmpeg не найден в папке bin".to_string());
    }

    // Создаем временный файл для постера с расширением .jpg
    let temp_file = Builder::new()
        .suffix(".jpg")
        .tempfile()
        .map_err(|e| format!("Ошибка создания временного файла: {}", e))?;
    let temp_path = temp_file.path().to_path_buf();

    let shell = app_handle.shell();
    let output = shell
        .command(&ffmpeg_path)
        .args([
            "-i",
            &path,
            "-ss",
            "3", // захватываем кадр на 3 секунде
            "-vf",
            "scale=200:-1", // уменьшаем размер для скорости
            "-q:v",
            "2", // низкое качество JPEG для скорости
            "-vframes",
            "1",
            "-y", // перезаписываем файл без подтверждения
            temp_path.to_str().unwrap(),
        ])
        .output()
        .await
        .map_err(|e| format!("Ошибка выполнения FFmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg завершился с ошибкой: {}", stderr));
    }

    // Читаем содержимое временного файла
    let image_data = tokio::fs::read(&temp_path)
        .await
        .map_err(|e| format!("Ошибка чтения временного файла: {}", e))?;

    // Определяем тип по сигнатуре байтов
    let mime_type = detect_image_mime(&image_data);

    // Кодируем в base64 и собираем data URI
    let b64 = general_purpose::STANDARD.encode(&image_data);
    let data_uri = format!("data:{};base64,{}", mime_type, b64);

    // Временный файл автоматически удалится при выходе из области видимости
    Ok(data_uri)
}

/// Определяет тип изображения по магическим байтам (PNG, JPEG, WEBP)
fn detect_image_mime(bytes: &[u8]) -> &'static str {
    if bytes.starts_with(&[0x89, b'P', b'N', b'G']) {
        "image/png"
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        "image/jpeg"
    } else if bytes.starts_with(b"RIFF") && bytes.len() > 12 && &bytes[8..12] == b"WEBP" {
        "image/webp"
    } else {
        "application/octet-stream"
    }
}

#[tauri::command]
pub async fn get_video_stream(app_handle: AppHandle, url: String) -> Result<String, String> {
    let project_dir = std::env::current_dir()
        .map_err(|e| format!("Ошибка получения текущей директории: {}", e))?;

    let yt_dlp_path = project_dir.join("bin\\yt-dlp.exe");
    let cookies_file = project_dir.join("bin\\cookies1.txt");

    if !yt_dlp_path.exists() {
        return Err("FFmpeg не найден в папке bin".to_string());
    }

    let shell = app_handle.shell();
    let output = shell
        .command(&yt_dlp_path)
        .args(["-g", &url])
        .arg("--cookies")
        .arg(cookies_file.to_str().unwrap())
        .arg("--no-check-certificate")
        .output()
        .await
        .map_err(|e| format!("Ошибка выполнения yt-dlp: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp завершился с ошибкой: {}", stderr));
    }

    let stream_url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(stream_url)
}
