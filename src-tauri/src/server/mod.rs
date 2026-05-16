use futures_util::StreamExt;
use hyper::{
    header::{HeaderValue, RANGE},
    service::{make_service_fn, service_fn},
    Body, Method, Request, Response, Server, StatusCode,
};
use percent_encoding::percent_decode_str;
use reqwest::header as reqwest_header;
use std::{
    convert::Infallible,
    net::SocketAddr,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        OnceLock,
    },
};
use tokio::{
    fs::File,
    io::{AsyncReadExt, AsyncSeekExt},
};
use tokio_util::io::ReaderStream;

static SERVER_RUNNING: OnceLock<AtomicBool> = OnceLock::new();

pub async fn run_file_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let flag = SERVER_RUNNING.get_or_init(|| AtomicBool::new(false));
    if flag.load(Ordering::SeqCst) {
        println!("⚙️ Сервер уже запущен");
        return Ok(());
    }
    flag.store(true, Ordering::SeqCst);

    tokio::spawn(async move {
        let make_svc = make_service_fn(|_conn| async {
            Ok::<_, Infallible>(service_fn(|req: Request<Body>| async move {
                let mut builder = Response::builder()
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Headers", "Range, Content-Type")
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");

                if req.method() == Method::OPTIONS {
                    return Ok::<_, Infallible>(builder.status(200).body(Body::empty()).unwrap());
                }

                if req.method() != Method::GET && req.method() != Method::HEAD {
                    return Ok::<_, Infallible>(
                        builder
                            .status(405)
                            .body(Body::from("Method Not Allowed"))
                            .unwrap(),
                    );
                }

                if !req.uri().path().eq("/file") {
                    return Ok::<_, Infallible>(
                        builder.status(404).body(Body::from("Not Found")).unwrap(),
                    );
                }

                let query = req.uri().query().unwrap_or("");
                let mut path_opt = None;
                let mut url_opt = None;

                for pair in query.split('&') {
                    if let Some((k, v)) = pair.split_once('=') {
                        let decoded = percent_decode_str(v).decode_utf8_lossy().to_string();
                        match k {
                            "path" => path_opt = Some(decoded),
                            "url" => url_opt = Some(decoded),
                            _ => {}
                        }
                    }
                }

                // ==== локальный файл ====
                if let Some(path_str) = path_opt {
                    let path = PathBuf::from(&path_str);
                    if !path.exists() {
                        return Ok(builder
                            .status(404)
                            .body(Body::from("File not found"))
                            .unwrap());
                    }

                    let mut file = match File::open(&path).await {
                        Ok(f) => f,
                        Err(_) => {
                            return Ok(builder
                                .status(500)
                                .body(Body::from("Failed to open file"))
                                .unwrap())
                        }
                    };
                    let metadata = match file.metadata().await {
                        Ok(m) => m,
                        Err(_) => {
                            return Ok(builder
                                .status(500)
                                .body(Body::from("Failed to get file metadata"))
                                .unwrap())
                        }
                    };
                    let file_size = metadata.len();

                    let range = req.headers().get(RANGE).and_then(|v| v.to_str().ok());
                    let (start, end) = if let Some(range_str) = range {
                        let parts: Vec<&str> =
                            range_str.trim_start_matches("bytes=").split('-').collect();
                        let s = if parts[0].is_empty() {
                            0
                        } else {
                            parts[0].parse::<u64>().unwrap_or(0)
                        };
                        let e = parts
                            .get(1)
                            .and_then(|x| {
                                if x.is_empty() {
                                    None
                                } else {
                                    x.parse::<u64>().ok()
                                }
                            })
                            .unwrap_or(file_size - 1);
                        (s, e)
                    } else {
                        (0, file_size - 1)
                    };

                    if start >= file_size || end >= file_size || start > end {
                        return Ok(builder
                            .status(416)
                            .body(Body::from("Range Not Satisfiable"))
                            .unwrap());
                    }

                    if let Err(_) = file.seek(std::io::SeekFrom::Start(start)).await {
                        return Ok(builder
                            .status(500)
                            .body(Body::from("Failed to seek file"))
                            .unwrap());
                    }
                    let length = end - start + 1;

                    let stream = ReaderStream::new(file.take(length));
                    let body = Body::wrap_stream(stream);

                    builder = builder
                        .header("Accept-Ranges", "bytes")
                        .header("Content-Length", length.to_string())
                        .header(
                            "Content-Type",
                            mime_guess::from_path(&path)
                                .first_or_octet_stream()
                                .to_string(),
                        );

                    if range.is_some() {
                        builder = builder.status(StatusCode::PARTIAL_CONTENT).header(
                            "Content-Range",
                            format!("bytes {}-{}/{}", start, end, file_size),
                        );
                    }

                    return Ok::<_, Infallible>(builder.body(body).unwrap());
                }

                // ==== удалённый URL ====
                if let Some(url_str) = url_opt {
                    let url = match reqwest::Url::parse(&url_str) {
                        Ok(u) => u,
                        Err(_) => {
                            return Ok(builder.status(400).body(Body::from("Invalid URL")).unwrap())
                        }
                    };

                    let client = reqwest::Client::new();

                    // Прокси-запрос с оригинальными заголовками (включая Range)
                    let mut request_builder = client.get(url);
                    if let Some(range) = req.headers().get(RANGE) {
                        if let Ok(reqwest_range) =
                            reqwest::header::HeaderValue::from_bytes(range.as_bytes())
                        {
                            request_builder =
                                request_builder.header(reqwest_header::RANGE, reqwest_range);
                        }
                    }

                    match request_builder.send().await {
                        Ok(resp) => {
                            let status = StatusCode::from_u16(resp.status().as_u16())
                                .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
                            let headers = resp.headers().clone();
                            let content_type = headers
                                .get("content-type")
                                .and_then(|v| v.to_str().ok())
                                .unwrap_or("application/octet-stream")
                                .to_string();

                            let body_stream = resp.bytes_stream().map(|chunk| {
                                chunk.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
                            });

                            let body = Body::wrap_stream(body_stream);

                            builder = builder
                                .status(status)
                                .header("Content-Type", content_type)
                                .header("Accept-Ranges", "bytes");

                            if let Some(range_val) = headers.get(reqwest_header::CONTENT_RANGE) {
                                if let Ok(hv) =
                                    HeaderValue::from_str(range_val.to_str().unwrap_or(""))
                                {
                                    builder = builder.header("Content-Range", hv);
                                }
                            }
                            if let Some(len_val) = headers.get(reqwest_header::CONTENT_LENGTH) {
                                if let Ok(hv) =
                                    HeaderValue::from_str(len_val.to_str().unwrap_or(""))
                                {
                                    builder = builder.header("Content-Length", hv);
                                }
                            }

                            return Ok::<_, Infallible>(builder.body(body).unwrap());
                        }
                        Err(e) => {
                            return Ok::<_, Infallible>(
                                builder
                                    .status(500)
                                    .body(Body::from(format!("Proxy error: {}", e)))
                                    .unwrap(),
                            );
                        }
                    }
                }

                Ok::<_, Infallible>(
                    builder
                        .status(400)
                        .body(Body::from("Missing path or url"))
                        .unwrap(),
                )
            }))
        });

        let addr = SocketAddr::from(([127, 0, 0, 1], 7878));
        println!("✅ Сервер запущен: http://{}/file?url=...", addr);

        if let Err(e) = Server::bind(&addr).serve(make_svc).await {
            eprintln!("Server error: {}", e);
        }
    });

    Ok(())
} 