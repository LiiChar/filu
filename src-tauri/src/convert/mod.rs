use std::path::PathBuf;
use std::process::Command;
use std::process::Stdio;

fn get_video_duration(ffmpeg_path: &str, input_path: &str) -> u64 {
    let output = Command::new(ffmpeg_path)
        .args(["-i", input_path])
        .output()
        .expect("failed to run ffmpeg");

    let stderr = String::from_utf8_lossy(&output.stderr);

    for line in stderr.lines() {
        if line.contains("Duration:") {
            // Пример строки: Duration: 00:05:32.45, start: 0.000000, bitrate: 1536 kb/s
            let parts: Vec<&str> = line.split("Duration:").collect();
            if parts.len() < 2 {
                continue;
            }

            let duration_str = parts[1].split(',').next().unwrap().trim();
            let time_parts: Vec<&str> = duration_str.split(':').collect();
            if time_parts.len() != 3 {
                continue;
            }

            let hours: u64 = time_parts[0].parse().unwrap_or(0);
            let minutes: u64 = time_parts[1].parse().unwrap_or(0);
            let seconds: f64 = time_parts[2].parse().unwrap_or(0.0);

            return hours * 3600 + minutes * 60 + seconds as u64;
        }
    }

    0
}
fn calculate_optimal_duration(total_seconds: u64) -> u64 {
    // Если видео короткое, сегмент равен половине видео
    if total_seconds < 120 {
        total_seconds
    } else if total_seconds < 600 {
        60 // 1 минута для видео до 10 минут
    } else {
        120 // 2 минуты для длинных видео
    }
}

pub fn convert_segment(input_path: &str, start: u64) -> PathBuf {
    let ffmpeg_path = std::env::current_exe().unwrap().join("ffmpeg.exe"); // Windows

    let total_duration = get_video_duration(ffmpeg_path.to_str().unwrap(), &input_path);
    let duration = calculate_optimal_duration(total_duration);
    let tmp_file = std::env::temp_dir().join("current_segment.mp4");

    let status = Command::new(ffmpeg_path)
        .args([
            "-i",
            input_path,
            "-ss",
            &start.to_string(),
            "-t",
            &duration.to_string(),
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-c:a",
            "aac",
            "-movflags",
            "+faststart",
            tmp_file.to_str().unwrap(),
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .expect("ffmpeg failed");

    if !status.success() {
        panic!("ffmpeg failed to convert video segment");
    }

    tmp_file
}
