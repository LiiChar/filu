// use dirs;
// use serde::{Deserialize, Serialize};
// use serde_json::{json, Map, Value};
// use std::collections::HashMap;
// use std::path::Path;
// use std::path::PathBuf;

// /// Абстракция менеджера настроек — имплементируй по-своему
// pub trait SettingsManager: Send + Sync {
//     fn get_network_settings(&self) -> NetworkSettings;
// }

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct NetworkSettings {
//     pub cookies_enabled: bool,
//     pub cookies_browser: String,
//     pub cookies_fallback_browsers: Vec<String>,
// }

// impl Default for NetworkSettings {
//     fn default() -> Self {
//         Self {
//             cookies_enabled: true,
//             cookies_browser: "chrome".to_string(),
//             cookies_fallback_browsers: vec![],
//         }
//     }
// }

// pub struct CookieManager<'a> {
//     settings_manager: &'a dyn SettingsManager,
//     browser_priority: Vec<&'static str>,
//     site_browser_preferences: HashMap<&'static str, Vec<&'static str>>,
// }

// impl<'a> CookieManager<'a> {
//     pub fn new(settings_manager: &'a dyn SettingsManager) -> Self {
//         let mut site_browser_preferences = HashMap::new();
//         site_browser_preferences.insert("vk.com", vec!["edge", "chrome", "firefox"]);
//         site_browser_preferences.insert("vkvideo.ru", vec!["edge", "chrome", "firefox"]);

//         Self {
//             settings_manager,
//             browser_priority: vec!["chrome", "firefox", "edge", "safari", "chromium", "opera"],
//             site_browser_preferences,
//         }
//     }

//     /// Основная функция: возвращает serde_json::Map с опциями (похожа на dict в Python)
//     pub fn get_cookie_options(&self, url: Option<&str>) -> Map<String, Value> {
//         let net = self.settings_manager.get_network_settings();

//         if !net.cookies_enabled {
//             return Map::new();
//         }

//         let preferred_browser = net.cookies_browser;
//         let fallback_browsers = net.cookies_fallback_browsers;

//         // site-specific browsers
//         let mut site_browsers: Option<Vec<&str>> = None;
//         if let Some(u) = url {
//             let lower = u.to_lowercase();
//             for (site, browsers) in &self.site_browser_preferences {
//                 if lower.contains(site) {
//                     site_browsers = Some(browsers.clone());
//                     break;
//                 }
//             }
//         }

//         // build browsers_to_try
//         let mut browsers_to_try: Vec<String> = Vec::new();
//         if let Some(mut sb) = site_browsers {
//             for b in sb.iter() {
//                 browsers_to_try.push(b.to_string());
//             }
//             if !browsers_to_try.contains(&preferred_browser) {
//                 browsers_to_try.push(preferred_browser.clone());
//             }
//             for fb in fallback_browsers.iter() {
//                 if !browsers_to_try.contains(fb) {
//                     browsers_to_try.push(fb.clone());
//                 }
//             }
//         } else {
//             browsers_to_try.push(preferred_browser.clone());
//             for fb in fallback_browsers.iter() {
//                 if !browsers_to_try.contains(fb) {
//                     browsers_to_try.push(fb.clone());
//                 }
//             }
//         }

//         for pb in &self.browser_priority {
//             if !browsers_to_try.iter().any(|s| s == pb) {
//                 browsers_to_try.push(pb.to_string());
//             }
//         }

//         for browser in browsers_to_try {
//             if self.is_browser_available(&browser) {
//                 let mut opts = Map::new();

//                 // cookiesfrombrowser: (browser, None, None, None) -> represent as array where None -> null
//                 let cookie_from_browser = json!([browser, Value::Null, Value::Null, Value::Null]);
//                 opts.insert("cookiesfrombrowser".to_string(), cookie_from_browser);

//                 if let Some(u) = url {
//                     let site_opts = self.get_site_specific_options(u);
//                     for (k, v) in site_opts {
//                         opts.insert(k, v);
//                     }
//                 }

//                 return opts;
//             }
//         }

//         Map::new()
//     }

//     fn is_browser_available(&self, browser: &str) -> bool {
//         match browser {
//             "chrome" => self.check_chrome_available(),
//             "firefox" => self.check_firefox_available(),
//             "edge" => self.check_edge_available(),
//             "safari" => self.check_safari_available(),
//             "chromium" => self.check_chromium_available(),
//             "opera" => self.check_opera_available(),
//             _ => false,
//         }
//     }

//     fn check_chrome_available(&self) -> bool {
//         let system = std::env::consts::OS; // "windows", "macos", "linux"
//         let mut paths: Vec<PathBuf> = Vec::new();
//         if system == "windows" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("AppData");
//                 p.push("Local");
//                 p.push("Google");
//                 p.push("Chrome");
//                 p.push("User Data");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from(
//                 "C:/Program Files/Google/Chrome/Application/chrome.exe",
//             ));
//             paths.push(PathBuf::from(
//                 "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
//             ));
//         } else if system == "macos" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("Library");
//                 p.push("Application Support");
//                 p.push("Google");
//                 p.push("Chrome");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/Applications/Google Chrome.app"));
//         } else {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push(".config");
//                 p.push("google-chrome");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/usr/bin/google-chrome"));
//             paths.push(PathBuf::from("/usr/bin/chrome"));
//         }
//         paths.into_iter().any(|p| p.exists())
//     }

//     fn check_firefox_available(&self) -> bool {
//         let system = std::env::consts::OS;
//         let mut paths: Vec<PathBuf> = Vec::new();
//         if system == "windows" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("AppData");
//                 p.push("Roaming");
//                 p.push("Mozilla");
//                 p.push("Firefox");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from(
//                 "C:/Program Files/Mozilla Firefox/firefox.exe",
//             ));
//             paths.push(PathBuf::from(
//                 "C:/Program Files (x86)/Mozilla Firefox/firefox.exe",
//             ));
//         } else if system == "macos" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("Library");
//                 p.push("Application Support");
//                 p.push("Firefox");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/Applications/Firefox.app"));
//         } else {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push(".mozilla");
//                 p.push("firefox");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/usr/bin/firefox"));
//         }
//         paths.into_iter().any(|p| p.exists())
//     }

//     fn check_edge_available(&self) -> bool {
//         let system = std::env::consts::OS;
//         let mut paths: Vec<PathBuf> = Vec::new();
//         if system == "windows" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("AppData");
//                 p.push("Local");
//                 p.push("Microsoft");
//                 p.push("Edge");
//                 p.push("User Data");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from(
//                 "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
//             ));
//         } else if system == "macos" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("Library");
//                 p.push("Application Support");
//                 p.push("Microsoft Edge");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/Applications/Microsoft Edge.app"));
//         } else {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push(".config");
//                 p.push("microsoft-edge");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/usr/bin/microsoft-edge"));
//         }
//         paths.into_iter().any(|p| p.exists())
//     }

//     fn check_safari_available(&self) -> bool {
//         // Safari only on macos
//         if std::env::consts::OS != "macos" {
//             return false;
//         }
//         let mut paths: Vec<PathBuf> = Vec::new();
//         if let Some(mut p) = dirs::home_dir() {
//             p.push("Library");
//             p.push("Safari");
//             paths.push(p);
//         }
//         paths.push(PathBuf::from("/Applications/Safari.app"));
//         paths.into_iter().any(|p| p.exists())
//     }

//     fn check_chromium_available(&self) -> bool {
//         let system = std::env::consts::OS;
//         let mut paths: Vec<PathBuf> = Vec::new();
//         if system == "windows" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("AppData");
//                 p.push("Local");
//                 p.push("Chromium");
//                 p.push("User Data");
//                 paths.push(p);
//             }
//         } else if system == "macos" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("Library");
//                 p.push("Application Support");
//                 p.push("Chromium");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/Applications/Chromium.app"));
//         } else {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push(".config");
//                 p.push("chromium");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/usr/bin/chromium"));
//             paths.push(PathBuf::from("/usr/bin/chromium-browser"));
//         }
//         paths.into_iter().any(|p| p.exists())
//     }

//     fn check_opera_available(&self) -> bool {
//         let system = std::env::consts::OS;
//         let mut paths: Vec<PathBuf> = Vec::new();
//         if system == "windows" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("AppData");
//                 p.push("Roaming");
//                 p.push("Opera Software");
//                 p.push("Opera Stable");
//                 paths.push(p);
//             }
//         } else if system == "macos" {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push("Library");
//                 p.push("Application Support");
//                 p.push("com.operasoftware.Opera");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/Applications/Opera.app"));
//         } else {
//             if let Some(mut p) = dirs::home_dir() {
//                 p.push(".config");
//                 p.push("opera");
//                 paths.push(p);
//             }
//             paths.push(PathBuf::from("/usr/bin/opera"));
//         }
//         paths.into_iter().any(|p| p.exists())
//     }

//     fn get_site_specific_options(&self, url: &str) -> Map<String, Value> {
//         let mut options = Map::new();
//         let lower = url.to_lowercase();
//         if lower.contains("vk.com") || lower.contains("vkvideo.ru") {
//             let headers = json!({
//                 "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
//                 "Accept-Encoding": "gzip, deflate, br",
//                 "DNT": "1",
//                 "Connection": "keep-alive",
//                 "Upgrade-Insecure-Requests": "1",
//                 "Sec-Fetch-Dest": "document",
//                 "Sec-Fetch-Mode": "navigate",
//                 "Sec-Fetch-Site": "none",
//                 "Sec-Fetch-User": "?1",
//             });
//             options.insert("user_agent".to_string(), Value::String("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string()));
//             options.insert(
//                 "referer".to_string(),
//                 Value::String("https://vk.com/".to_string()),
//             );
//             options.insert("headers".to_string(), headers);
//         } else if lower.contains("youtube.com") || lower.contains("youtu.be") {
//             options.insert("user_agent".to_string(), Value::String("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string()));
//             options.insert(
//                 "referer".to_string(),
//                 Value::String("https://www.youtube.com/".to_string()),
//             );
//         }
//         options
//     }

//     /// Возвращает список доступных браузеров (как в Python)
//     pub fn get_available_browsers(&self) -> Vec<String> {
//         self.browser_priority
//             .iter()
//             .filter_map(|b| {
//                 if self.is_browser_available(b) {
//                     Some(b.to_string())
//                 } else {
//                     None
//                 }
//             })
//             .collect()
//     }
// }
