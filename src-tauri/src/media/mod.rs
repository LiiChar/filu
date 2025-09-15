use std::fs::File;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::default::get_probe;

pub fn get_media_tags(path: String) -> Result<Vec<(String, String)>, String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    let mut probed = get_probe()
        .format(
            &Default::default(),
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();

    if let Some(meta) = probed.metadata.get() {
        if let Some(rev) = meta.current() {
            for tag in rev.tags() {
                let key = tag
                    .std_key
                    .map(|k| format!("{:?}", k))
                    .unwrap_or_else(|| tag.key.to_string());
                let value = tag.value.to_string();
                tags.push((key, value));
            }
        }
    }

    if let Some(meta) = probed.format.metadata().current() {
        for tag in meta.tags() {
            let key = tag
                .std_key
                .map(|k| format!("{:?}", k))
                .unwrap_or_else(|| tag.key.to_string());
            let value = tag.value.to_string();
            tags.push((key, value));
        }
    }

    if tags.is_empty() {
        tags.push(("info".into(), "Файл не содержит метаданных".into()));
    }

    Ok(tags)
}
