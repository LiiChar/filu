use regex::Regex;
use serde_json::Value;
use std::collections::HashMap;
use std::env;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Listener, Manager};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

lazy_static::lazy_static! {
    static ref DOWNLOAD_PROCESSES: Mutex<HashMap<String, Arc<Mutex<Option<CommandChild>>>>> = Mutex::new(HashMap::new());
}

#[tauri::command]
pub async fn transfer_vid() -> Result<String, String> {
    let args: Vec<String> = env::args().collect();
    if args.len() == 2 {
        let path: String = args[1].clone();
        return Ok(path);
    } else {
        Err("".to_string())
    }
}

#[tauri::command]
pub async fn get_metadata(app_handle: AppHandle, url: String) -> Result<String, String> {
    let project_dir = std::env::current_dir().unwrap();
    let yt_dlp_path = project_dir.join("bin\\yt-dlp.exe");
    let cookies_file = project_dir.join("bin\\cookies.txt");

    let shell = app_handle
        .shell()
        .command(&yt_dlp_path)
        .arg("-j")
        .arg("--cookies")
        .arg(cookies_file.to_str().unwrap())
        .arg(url)
        .output()
        .await
        .unwrap();

    if shell.status.success() {
        return Ok(String::from_utf8(shell.stdout).unwrap());
    } else {
        return Err(format!("Exit with code: {}", shell.status.code().unwrap()));
    }
}

#[tauri::command]
pub async fn get_current_process() -> Result<Vec<String>, String> {
    let map = DOWNLOAD_PROCESSES
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    let process_names = map.keys().cloned().collect::<Vec<String>>();
    Ok(process_names)
}

#[tauri::command]
pub async fn get_title(app_handle: AppHandle, url: String) -> Result<String, String> {
    if url.contains("youtube.com") || url.contains("youtu.be") {
        if let Ok(resp) = reqwest::get(format!(
            "https://www.youtube.com/oembed?url={}&format=json",
            url
        ))
        .await
        {
            if let Ok(json) = resp.json::<Value>().await {
                if let Some(title) = json.get("title").and_then(|v| v.as_str()) {
                    return Ok(title.to_string());
                }
            }
        }
    }

    let project_dir = std::env::current_dir().unwrap();
    let yt_dlp_path = project_dir.join("bin\\yt-dlp.exe");
    let cookies_file = project_dir.join("bin\\cookies.txt");

    let shell = app_handle
        .shell()
        .command(&yt_dlp_path)
        .arg("--cookies")
        .arg(cookies_file.to_str().unwrap())
        .arg("--flat-playlist")
        .arg("--dump-single-json")
        .arg("--no-warnings")
        .arg("--quiet")
        .arg(&url)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if shell.status.success() {
        let output = String::from_utf8_lossy(&shell.stdout).to_string();
        let title = serde_json::from_str::<Value>(&output)
            .ok()
            .and_then(|v| {
                v.get("title")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            })
            .unwrap_or_else(|| "Unknown title".to_string());
        Ok(title)
    } else {
        Err(format!(
            "yt-dlp exited with code: {:?}",
            shell.status.code()
        ))
    }
}


pub async fn install_youtube_advanced(
    app_handle: &tauri::AppHandle,
    url: String,
    property: Vec<(String, String)>,
) -> Result<String, Box<dyn std::error::Error>> {
    let project_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    
    // Проверяем наличие бинарников (частая ошибка)
    let yt_dlp_path = project_dir.join("bin").join("yt-dlp.exe");
    let ffmpeg_path = project_dir.join("bin").join("ffmpeg.exe");
    
    if !yt_dlp_path.exists() {
        return Err(format!("yt-dlp not found at: {:?}", yt_dlp_path).into());
    }

    let props: HashMap<String, String> = property.into_iter().collect();
    let download_id = props.get("download_id").cloned().expect("Download id is required");

    // --- Подготовка путей и имени ---
    let custom_output_dir = props.get("output_url").cloned().unwrap_or_else(|| {
        project_dir.join("downloads").to_string_lossy().to_string()
    });
    
    let default_title = url.split('=').last().unwrap_or("video");
    let raw_title = props.get("title").cloned().unwrap_or(default_title.to_string());
    // Очистка имени от запрещенных символов
    let re = Regex::new(r#"[<>:"/\\|?*]"#).unwrap();
    let safe_title = re.replace_all(&raw_title, "_").to_string();
    
    let ext = props.get("ext").cloned().unwrap_or("mp4".to_string());
    let file_type = props.get("type").cloned().unwrap_or("all".to_string());
    let quality = props.get("quality").cloned().unwrap_or("720p".to_string());

    // Формируем шаблон пути
    // ВАЖНО: Добавляем .%(ext)s, чтобы yt-dlp сам подставил расширение
    let output_template = format!("{}{}.%(ext)s", custom_output_dir, safe_title);

    let shell = app_handle.shell();
    let mut command = shell.command(&yt_dlp_path);

    // --- Настройка аргументов ---
    // Для Twitter/X лучше использовать 'best', а не требовать 'ext=mp4' сразу, 
    // так как исходник может быть m3u8. Мы сконвертируем его позже флагом --recode-video
    let format_arg = match file_type.as_str() {
        "audio" => "bestaudio/best".to_string(),
        _ => format!("best[height<={}]/best", quality), // Убрали [ext=mp4] для надежности
    };

    command = command
        .arg("-f").arg(format_arg)
        .arg("-o").arg(&output_template)
        .arg("--no-part") // Не создавать .part файлы
        .arg("--force-overwrites"); // Перезаписывать, если есть

    // Передача cookies (если файл существует)
    let cookies_path = project_dir.join("bin").join("cookies1.txt");
    if cookies_path.exists() {
        command = command.arg("--cookies").arg(cookies_path);
    }

    // Конвертация
    if file_type == "audio" {
        command = command.arg("-x").arg("--audio-format").arg(&ext);
    } else if ext != "webm" {
        // Если скачалось mkv/ts, перекодируем в mp4
        command = command.arg("--recode-video").arg(&ext);
    }

    // Передаем пути к ffmpeg через ENV
    // Это критично для Twitter, так как там часто раздельные потоки видео/аудио
    command = command
        .arg(&url)
        .env("FFMPEG_LOCATION", ffmpeg_path)
        .env("LC_ALL", "en_US.UTF-8"); // Попытка исправить кодировку, если нужно

    let (mut rx, child) = command.spawn().map_err(|e| format!("Failed to run yt-dlp: {}", e))?;

    // --- Логирование и отслеживание ---
    let child_arc = Arc::new(Mutex::new(Some(child)));
    // ... (тут ваш код добавления в DOWNLOAD_PROCESSES и листенер отмены) ...

    let mut last_error_log = String::new();

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                let msg = String::from_utf8_lossy(&line).to_string();
                println!("OUT: {}", msg); // Смотрите в консоль приложения!
                let _ = app_handle.emit(&format!("progress-{}", download_id), msg);
            }
            CommandEvent::Stderr(line) => {
                let msg = String::from_utf8_lossy(&line).to_string();
                println!("ERR: {}", msg); // Смотрите в консоль приложения!
                // Сохраняем последние строки ошибок, чтобы показать их пользователю при сбое
                if !msg.trim().is_empty() {
                    last_error_log = msg.clone();
                }
                // Некоторые ворнинги yt-dlp кидает в stderr, но это не всегда фатально
                let _ = app_handle.emit(&format!("progress-{}", download_id), msg);
            }
            CommandEvent::Terminated(status) => {
               println!("Process terminated with code: {:?}", status.code);
            }
            _ => {}
        }
    }

    let _ = app_handle.emit(&format!("progress-{}", download_id), "Процесс завершен".to_string());

    // --- ПРОВЕРКА РЕЗУЛЬТАТА ---
    // Мы ожидаем файл по пути:
    let expected_file = format!("{}{}.{}", custom_output_dir, safe_title, ext);
    let path = Path::new(&expected_file);

    if path.exists() {
        println!("✅ Файл найден: {:?}", path);
        Ok(path.to_string_lossy().to_string())
    } else {
        // Если точного совпадения нет, ищем любой файл с таким именем (вдруг расширение другое)
        let file_stem = format!("{}{}", custom_output_dir, safe_title);
        // Простая проверка популярных расширений
        for check_ext in ["mp4", "mkv", "webm", "mp3", "m4a"] {
            let alt_path = Path::new(&file_stem).with_extension(check_ext);
            if alt_path.exists() {
                 println!("⚠️ Найдено с другим расширением: {:?}", alt_path);
                 return Ok(alt_path.to_string_lossy().to_string());
            }
        }

        // ЕСЛИ ФАЙЛА НЕТ - ВОЗВРАЩАЕМ ОШИБКУ
        println!("❌ Файл не создан. Последняя ошибка: {}", last_error_log);
        Err(format!("Загрузка не удалась. Файл не создан. yt-dlp: {}", last_error_log).into())
    }
}

#[tauri::command]
pub async fn download_video(
    app_handle: AppHandle,
    url: &str,
    property: Vec<(String, String)>,
) -> Result<String, String> {
    install_youtube_advanced(&app_handle, url.to_string(), property)
        .await
        .map_err(|e| e.to_string())
}
