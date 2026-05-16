pub struct Dlp {
    path: String,
    ffmpeg: Option<String>,
    ffprobe: Option<String>,
    cookies: Option<String>,
}

impl Dlp {
    pub fn new(
        path: String,
        ffmpeg: Option<String>,
        ffprobe: Option<String>,
        cookies: Option<String>,
    ) -> Dlp {
        Dlp {
            path,
            ffmpeg,
            ffprobe,
            cookies,
        }
    }
}
