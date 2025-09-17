// use std::path::PathBuf;
// use yt_dlp::fetcher::deps::Libraries;
// use yt_dlp::Youtube;

// pub fn download_video(url: &str, output_path: &str) -> Result<(), String> {
//     let libraries_dir = PathBuf::from("src/assets/utils/yt-dlp.exe");
//     let output_dir = PathBuf::from("public");

//     let youtube = libraries_dir.join("yt-dlp");
//     let ffmpeg = libraries_dir.join("ffmpeg");

//     let libraries = Libraries::new(youtube, ffmpeg);
//     let fetcher = Youtube::new(libraries, output_dir).unwrap();

//     let url = String::from("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
//     let video_path = fetcher
//         .download_video_from_url(url, "my-video.mp4")
//         .unwrap();
//     Ok(())
// }
