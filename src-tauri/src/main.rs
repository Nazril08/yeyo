// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::{self, File};
use std::io::copy;
use std::path::Path;
use std::time::SystemTime;
use std::process::Command;
use reqwest;
use serde::{Deserialize, Serialize};
use tauri::Window;

// Helper function to create Command with hidden console window on Windows
fn create_hidden_command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW flag
    }
    
    cmd
}

#[derive(Debug, Serialize, Deserialize)]
struct MediaFile {
    name: String,
    path: String,
    size: u64,
    modified: u64,
    #[serde(rename = "type")]
    file_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct VideoInfo {
    width: u32,
    height: u32,
    duration: f64,
    fps: f64,
    codec: String,
    bitrate: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ConversionSettings {
    #[serde(rename = "videoCodec")]
    video_codec: String,
    #[serde(rename = "audioCodec")]
    audio_codec: String,
    crf: Option<u32>,
    preset: Option<String>,
    bitrate: Option<String>,
    #[serde(rename = "fastMode")]
    fast_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AudioConversionSettings {
    codec: String,
    bitrate: Option<String>,
    #[serde(rename = "sampleRate")]
    sample_rate: Option<u32>,
    channels: Option<u32>,
    compression: Option<u32>,
    #[serde(rename = "extractFromVideo")]
    extract_from_video: Option<bool>,
}

#[derive(Serialize, Deserialize)]
struct NoiseReductionSettings {
    input_path: String,
    output_dir: String,
    preset: String,
    algorithm: String,
    noise_reduction: f32,
    noise_floor: f32,
    highpass_freq: Option<f32>,
    lowpass_freq: Option<f32>,
    notch_freq: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DownloadOptions {
    url: String,
    output_dir: String,
    quality: String,
    format: String,
    audio_only: bool,
    audio_format: String,
    embed_subs: bool,
    embed_thumbnail: bool,
    embed_metadata: bool,
    retries: u32,
    cookie_file: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct VideoInfoResponse {
    title: String,
    duration: u32,
    thumbnail: String,
    uploader: String,
    formats: Vec<VideoFormat>,
}

#[derive(Debug, Serialize, Deserialize)]
struct VideoFormat {
    format_id: String,
    ext: String,
    width: Option<u32>,
    height: Option<u32>,
    filesize: Option<u64>,
    vcodec: Option<String>,
    acodec: Option<String>,
    format_note: Option<String>,
}




// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn download_file(url: String, path: String) -> Result<String, String> {
    match download_file_internal(url, path).await {
        Ok(_) => Ok("Download completed successfully".to_string()),
        Err(e) => Err(format!("Download failed: {}", e)),
    }
}

#[tauri::command]
async fn select_directory() -> Result<String, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;
    
    match FileDialogBuilder::new().pick_folder() {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("No directory selected".to_string()),
    }
}

#[tauri::command]
async fn scan_media_files(directory: String, extensions: Vec<String>) -> Result<Vec<MediaFile>, String> {
    let path = Path::new(&directory);
    
    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory path".to_string());
    }

    let mut files = Vec::new();
    let extensions_lower: Vec<String> = extensions.iter().map(|ext| ext.to_lowercase()).collect();

    match scan_directory_recursive(path, &extensions_lower) {
        Ok(mut found_files) => {
            files.append(&mut found_files);
            // Sort by name
            files.sort_by(|a, b| a.name.cmp(&b.name));
            Ok(files)
        }
        Err(e) => Err(format!("Failed to scan directory: {}", e)),
    }
}

fn scan_directory_recursive(dir: &Path, extensions: &[String]) -> Result<Vec<MediaFile>, Box<dyn std::error::Error>> {
    let mut files = Vec::new();
    
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                // Recursively scan subdirectories
                match scan_directory_recursive(&path, extensions) {
                    Ok(mut sub_files) => files.append(&mut sub_files),
                    Err(_) => continue, // Skip inaccessible directories
                }
            } else if path.is_file() {
                if let Some(extension) = path.extension() {
                    if let Some(ext_str) = extension.to_str() {
                        let ext_lower = ext_str.to_lowercase();
                        if extensions.contains(&ext_lower) {
                            if let Ok(metadata) = fs::metadata(&path) {
                                let file_type = if is_video_extension(&ext_lower) {
                                    "video"
                                } else {
                                    "audio"
                                };

                                let modified = metadata
                                    .modified()
                                    .unwrap_or(SystemTime::UNIX_EPOCH)
                                    .duration_since(SystemTime::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs();

                                files.push(MediaFile {
                                    name: path.file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .to_string(),
                                    path: path.to_string_lossy().to_string(),
                                    size: metadata.len(),
                                    modified,
                                    file_type: file_type.to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(files)
}

fn is_video_extension(ext: &str) -> bool {
    matches!(ext, "mp4" | "avi" | "mkv" | "mov" | "wmv" | "flv" | "webm" | "m4v" | "3gp" | "ogv")
}

#[tauri::command]
async fn get_file_url(path: String) -> Result<String, String> {
    let file_path = Path::new(&path);
    if file_path.exists() {
        // For Tauri, we need to use the convertFileSrc API on the frontend
        // Just return the original path, the frontend will handle the conversion
        Ok(path)
    } else {
        Err("File not found".to_string())
    }
}

#[tauri::command]
async fn toggle_fullscreen(window: Window) -> Result<(), String> {
    match window.is_fullscreen() {
        Ok(is_fullscreen) => {
            if is_fullscreen {
                window.set_fullscreen(false).map_err(|e| e.to_string())?;
            } else {
                window.set_fullscreen(true).map_err(|e| e.to_string())?;
            }
            Ok(())
        }
        Err(e) => Err(e.to_string())
    }
}



#[tauri::command]
async fn get_media_duration(file_path: String) -> Result<f64, String> {
    let output = create_hidden_command("ffprobe")
        .args([
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &file_path
        ])
        .output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "FFprobe not found. Please install FFmpeg and add it to your PATH.".to_string()
            } else {
                format!("Failed to execute ffprobe: {}", e)
            }
        })?;

    if !output.status.success() {
        return Err("Failed to get file information".to_string());
    }

    let json_str = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse ffprobe output: {}", e))?;
    
    let parsed: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let duration = parsed["format"]["duration"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .ok_or("Could not parse duration")?;
    
    Ok(duration)
}

#[tauri::command]
async fn open_file_location(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    let dir = path.parent().unwrap_or(path);
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open file location: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open file location: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open file location: {}", e))?;
    }
    
    Ok(())
}

// Check if FFmpeg is available
#[tauri::command]
async fn check_ffmpeg() -> Result<bool, String> {
    let output = create_hidden_command("ffmpeg")
        .arg("-version")
        .output();
    match output {
        Ok(result) => Ok(result.status.success()),
        Err(_) => Ok(false),
    }
}

// Calculate how many loops are needed
#[tauri::command]
fn calculate_loops(file_duration: f64, target_duration: f64) -> u32 {
    if file_duration <= 0.0 {
        return 0;
    }
    (target_duration / file_duration).ceil() as u32
}

// Process the file with FFmpeg
#[tauri::command]
async fn loop_media(input_path: String, output_directory: String, target_duration: f64) -> Result<String, String> {
    let file_duration = get_media_duration(input_path.clone()).await?;
    let loops_needed = calculate_loops(file_duration, target_duration);
    
    if loops_needed == 0 {
        return Err("Invalid file duration".to_string());
    }
    
    if loops_needed == 1 {
        return Err("Target duration must be longer than original".to_string());
    }
    
    // Generate output path with Loop_ prefix
    let input_path_buf = Path::new(&input_path);
    let file_name = input_path_buf.file_name()
        .and_then(|name| name.to_str())
        .ok_or("Invalid input file name")?;
    
    let output_dir = if output_directory.is_empty() {
        // If no output directory specified, use same directory as input
        input_path_buf.parent()
            .ok_or("Could not determine parent directory")?
    } else {
        Path::new(&output_directory)
    };
    
    let loop_filename = format!("Loop_{}", file_name);
    let final_output_path = output_dir.join(loop_filename);
    
    // Create output directory if it doesn't exist
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;
    
    // FFmpeg command to loop the video/audio
    let mut cmd = create_hidden_command("ffmpeg");
    cmd.args([
        "-y", // Overwrite output file
        "-stream_loop", &(loops_needed - 1).to_string(), // Loop count (n-1 because original plays once)
        "-i", &input_path,
        "-t", &target_duration.to_string(), // Limit output duration
        "-c", "copy", // Copy streams without re-encoding when possible
        &final_output_path.to_string_lossy()
    ]);
    
    let output = cmd.output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "FFmpeg not found. Please install FFmpeg and add it to your PATH.".to_string()
            } else {
                format!("Failed to execute ffmpeg: {}", e)
            }
        })?;
    
    if output.status.success() {
        Ok(final_output_path.to_string_lossy().to_string())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("FFmpeg error: {}", error_msg))
    }
}

async fn download_file_internal(url: String, path: String) -> Result<(), Box<dyn std::error::Error>> {
    // Create HTTP client
    let client = reqwest::Client::new();
    
    // Download the file
    let response = client.get(&url).send().await?;
    
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    // Get the response bytes
    let bytes = response.bytes().await?;
    
    // Write to file
    let mut file = File::create(&path)?;
    copy(&mut bytes.as_ref(), &mut file)?;
    
    Ok(())
}

#[tauri::command]
async fn get_video_info(file_path: String) -> Result<VideoInfo, String> {
    let output = create_hidden_command("ffprobe")
        .args([
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &file_path
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

    if !output.status.success() {
        return Err("ffprobe failed to analyze the video".to_string());
    }

    let json_str = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse ffprobe output: {}", e))?;

    let parsed: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // Find video stream
    let streams = parsed["streams"].as_array()
        .ok_or("No streams found")?;
    
    let video_stream = streams.iter()
        .find(|stream| stream["codec_type"] == "video")
        .ok_or("No video stream found")?;

    let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
    let height = video_stream["height"].as_u64().unwrap_or(0) as u32;
    let fps_str = video_stream["r_frame_rate"].as_str().unwrap_or("0/1");
    let codec = video_stream["codec_name"].as_str().unwrap_or("unknown").to_string();
    
    // Parse FPS fraction
    let fps = if let Some((num, den)) = fps_str.split_once('/') {
        let num: f64 = num.parse().unwrap_or(0.0);
        let den: f64 = den.parse().unwrap_or(1.0);
        if den != 0.0 { num / den } else { 0.0 }
    } else {
        fps_str.parse().unwrap_or(0.0)
    };

    let duration = parsed["format"]["duration"].as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    let bitrate = parsed["format"]["bit_rate"].as_str()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(0);

    Ok(VideoInfo {
        width,
        height,
        duration,
        fps,
        codec,
        bitrate,
    })
}

#[tauri::command]
async fn resize_video(
    input_path: String,
    output_width: u32,
    output_height: u32,
    maintain_aspect_ratio: bool,
    quality: u32,
    output_format: String,
) -> Result<String, String> {
    // Generate output path
    let input_pathbuf = Path::new(&input_path);
    let file_stem = input_pathbuf.file_stem()
        .ok_or("Invalid input file")?
        .to_string_lossy();
    let output_dir = input_pathbuf.parent()
        .ok_or("Cannot determine output directory")?;
    
    let output_path = output_dir.join(format!(
        "{}_resized_{}x{}.{}",
        file_stem,
        output_width,
        output_height,
        output_format
    ));

    let output_path_str = output_path.to_string_lossy().to_string();

    // Build scale filter
    let scale_filter = if maintain_aspect_ratio {
        format!("scale={}:{}:force_original_aspect_ratio=decrease", output_width, output_height)
    } else {
        format!("scale={}:{}", output_width, output_height)
    };

    // Calculate CRF value from quality (higher quality = lower CRF)
    let crf = 51 - (quality * 51 / 100);

    let output = create_hidden_command("ffmpeg")
        .args([
            "-i", &input_path,
            "-vf", &scale_filter,
            "-c:v", "libx264",
            "-crf", &crf.to_string(),
            "-c:a", "aac",
            "-b:a", "128k",
            "-y", // Overwrite output file
            &output_path_str
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg failed: {}", stderr));
    }

    Ok(output_path_str)
}

#[tauri::command]
async fn convert_video(
    input_path: String,
    output_format: String,
    output_directory: Option<String>,
    settings: ConversionSettings,
) -> Result<String, String> {
    // Generate output path
    let input_pathbuf = Path::new(&input_path);
    let file_stem = input_pathbuf.file_stem()
        .ok_or("Invalid input file")?
        .to_string_lossy();
    
    let output_dir = if let Some(dir) = output_directory {
        Path::new(&dir).to_path_buf()
    } else {
        input_pathbuf.parent()
            .ok_or("Cannot determine output directory")?
            .to_path_buf()
    };
    
    let output_path = output_dir.join(format!(
        "{}_converted.{}",
        file_stem,
        output_format
    ));

    let output_path_str = output_path.to_string_lossy().to_string();

    // Check for fast mode (container change only)
    if settings.fast_mode.unwrap_or(false) || settings.video_codec == "copy" {
        let output = create_hidden_command("ffmpeg")
            .args([
                "-i", &input_path,
                "-c", "copy",
                "-y", // Overwrite output file
                &output_path_str
            ])
            .output()
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("ffmpeg failed: {}", stderr));
        }

        return Ok(output_path_str);
    }

    // Build ffmpeg command arguments
    let mut args = vec![
        "-i".to_string(),
        input_path,
        "-c:v".to_string(),
        settings.video_codec.clone(),
        "-c:a".to_string(),
        settings.audio_codec.clone(),
    ];

    // Add quality settings
    if let Some(crf) = settings.crf {
        if settings.video_codec == "libx264" || settings.video_codec == "libx265" {
            args.push("-crf".to_string());
            args.push(crf.to_string());
        }
    }

    // Add preset
    if let Some(preset) = settings.preset {
        if settings.video_codec == "libx264" || settings.video_codec == "libx265" {
            args.push("-preset".to_string());
            args.push(preset);
        }
    }

    // Add bitrate if specified
    if let Some(bitrate) = settings.bitrate {
        if !bitrate.is_empty() {
            args.push("-b:v".to_string());
            args.push(bitrate);
        }
    }

    // Add audio bitrate
    args.push("-b:a".to_string());
    args.push("128k".to_string());

    // Add overwrite flag and output path
    args.push("-y".to_string());
    args.push(output_path_str.clone());

    // Convert Vec<String> to Vec<&str> for args
    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let output = create_hidden_command("ffmpeg")
        .args(args_refs)
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg failed: {}", stderr));
    }

    Ok(output_path_str)
}

#[tauri::command]
async fn convert_audio(
    input_path: String,
    output_format: String,
    output_directory: Option<String>,
    settings: AudioConversionSettings,
) -> Result<String, String> {
    // Generate output path
    let input_pathbuf = Path::new(&input_path);
    let file_stem = input_pathbuf.file_stem()
        .ok_or("Invalid input file")?
        .to_string_lossy();
    
    let output_dir = if let Some(dir) = output_directory {
        Path::new(&dir).to_path_buf()
    } else {
        input_pathbuf.parent()
            .ok_or("Cannot determine output directory")?
            .to_path_buf()
    };
    
    let output_path = output_dir.join(format!(
        "{}_converted.{}",
        file_stem,
        output_format
    ));

    let output_path_str = output_path.to_string_lossy().to_string();

    // Build ffmpeg command arguments
    let mut args = vec![
        "-i".to_string(),
        input_path,
    ];

    // Add audio codec
    args.push("-c:a".to_string());
    args.push(settings.codec.clone());

    // Add audio-specific settings
    if let Some(bitrate) = settings.bitrate {
        if !bitrate.is_empty() {
            args.push("-b:a".to_string());
            args.push(bitrate);
        }
    }

    // Add sample rate
    if let Some(sample_rate) = settings.sample_rate {
        args.push("-ar".to_string());
        args.push(sample_rate.to_string());
    }

    // Add channels
    if let Some(channels) = settings.channels {
        args.push("-ac".to_string());
        args.push(channels.to_string());
    }

    // Add compression level for FLAC
    if settings.codec == "flac" {
        if let Some(compression) = settings.compression {
            args.push("-compression_level".to_string());
            args.push(compression.to_string());
        }
    }

    // If extracting from video, disable video stream
    if settings.extract_from_video.unwrap_or(false) {
        args.push("-vn".to_string());
    }

    // Add overwrite flag and output path
    args.push("-y".to_string());
    args.push(output_path_str.clone());

    // Convert Vec<String> to Vec<&str> for args
    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let output = create_hidden_command("ffmpeg")
        .args(args_refs)
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg failed: {}", stderr));
    }

    Ok(output_path_str)
}

#[tauri::command]
async fn reduce_noise(settings: NoiseReductionSettings) -> Result<String, String> {
    let input_path = settings.input_path.clone();
    let output_dir = settings.output_dir;
    
    // Generate output filename
    let input_pathbuf = Path::new(&input_path);
    let file_stem = input_pathbuf.file_stem()
        .ok_or("Invalid input file")?
        .to_string_lossy();
    let extension = input_pathbuf.extension()
        .and_then(|s| s.to_str())
        .unwrap_or("wav");
    
    let output_filename = format!("{}_denoised.{}", file_stem, extension);
    let output_path = Path::new(&output_dir).join(output_filename);
    let output_path_str = output_path.to_string_lossy().to_string();

    // Build FFmpeg arguments based on algorithm
    let mut args = vec![
        "-i".to_string(),
        input_path,
        "-y".to_string(),
    ];

    // Build audio filter chain
    let mut filters = Vec::new();

    match settings.algorithm.as_str() {
        "afftdn" => {
            filters.push(format!("afftdn=nr={}:nf={}", settings.noise_reduction, settings.noise_floor));
        },
        "anlmdn" => {
            filters.push(format!("anlmdn=s={}:o={}", settings.noise_reduction, settings.noise_floor.abs()));
        },
        "highpass" => {
            if let Some(freq) = settings.highpass_freq {
                filters.push(format!("highpass=f={}", freq));
            }
        },
        "combined" => {
            // High-pass filter to remove low-frequency noise
            if let Some(freq) = settings.highpass_freq {
                filters.push(format!("highpass=f={}", freq));
            }
            // FFT denoising
            filters.push(format!("afftdn=nr={}:nf={}", settings.noise_reduction, settings.noise_floor));
            // Low-pass filter if specified
            if let Some(freq) = settings.lowpass_freq {
                filters.push(format!("lowpass=f={}", freq));
            }
        },
        "afftdn+highpass+lowpass" => {
            // Speech enhancement preset
            if let Some(freq) = settings.highpass_freq {
                filters.push(format!("highpass=f={}", freq));
            }
            filters.push(format!("afftdn=nr={}:nf={}", settings.noise_reduction, settings.noise_floor));
            if let Some(freq) = settings.lowpass_freq {
                filters.push(format!("lowpass=f={}", freq));
            }
        },
        "highpass+notch" => {
            // Hum removal preset
            if let Some(freq) = settings.highpass_freq {
                filters.push(format!("highpass=f={}", freq));
            }
            if let Some(freq) = settings.notch_freq {
                filters.push(format!("bandreject=f={}:w=10", freq));
            }
        },
        _ => {
            // Default to afftdn
            filters.push(format!("afftdn=nr={}:nf={}", settings.noise_reduction, settings.noise_floor));
        }
    }

    // Add notch filter for specific frequency removal if specified
    if let Some(freq) = settings.notch_freq {
        if !settings.algorithm.contains("notch") {
            filters.push(format!("bandreject=f={}:w=10", freq));
        }
    }

    // Join filters with comma
    if !filters.is_empty() {
        args.push("-af".to_string());
        args.push(filters.join(","));
    }

    // Add output path
    args.push(output_path_str.clone());

    // Execute FFmpeg command
    let mut cmd = create_hidden_command("ffmpeg");
    cmd.args(&args);

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg failed: {}", stderr));
    }

    Ok(output_path_str)
}

// yt-dlp related functions
#[tauri::command]
async fn ytdlp_get_info(url: String) -> Result<serde_json::Value, String> {
    // Check if yt-dlp is available
    let mut check_cmd = create_hidden_command("yt-dlp");
    check_cmd.arg("--version");
    
    match check_cmd.output() {
        Ok(_) => {},
        Err(_) => return Err("yt-dlp is not installed or not found in PATH. Please install yt-dlp first.".to_string()),
    }

    // Get video information
    let mut cmd = create_hidden_command("yt-dlp");
    cmd.args(&[
        "--dump-json",
        "--no-playlist", // Only get info for single video, not entire playlist
        &url
    ]);

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                match serde_json::from_str::<serde_json::Value>(&output_str) {
                    Ok(json) => Ok(json),
                    Err(e) => Err(format!("Failed to parse video info: {}", e)),
                }
            } else {
                let error_str = String::from_utf8_lossy(&output.stderr);
                Err(format!("yt-dlp error: {}", error_str))
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

#[tauri::command]
async fn ytdlp_get_playlist_info(url: String) -> Result<serde_json::Value, String> {
    // Check if yt-dlp is available
    let mut check_cmd = create_hidden_command("yt-dlp");
    check_cmd.arg("--version");
    
    match check_cmd.output() {
        Ok(_) => {},
        Err(_) => return Err("yt-dlp is not installed or not found in PATH. Please install yt-dlp first.".to_string()),
    }

    // Get playlist information
    let mut cmd = create_hidden_command("yt-dlp");
    cmd.args(&[
        "--dump-json",
        "--flat-playlist", // Get playlist entries without downloading
        "--skip-download", // Don't download, just get info
        &url
    ]);

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                
                // Parse each line as a separate JSON object (yt-dlp outputs one JSON per line for playlists)
                let mut playlist_videos = Vec::new();
                for line in output_str.lines() {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                        playlist_videos.push(json);
                    }
                }
                
                // Return as a JSON array
                Ok(serde_json::json!({
                    "playlist_count": playlist_videos.len(),
                    "entries": playlist_videos
                }))
            } else {
                let error_str = String::from_utf8_lossy(&output.stderr);
                Err(format!("yt-dlp error: {}", error_str))
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

#[tauri::command]
async fn ytdlp_get_video_details(video_id: String) -> Result<serde_json::Value, String> {
    // Check if yt-dlp is available
    let mut check_cmd = create_hidden_command("yt-dlp");
    check_cmd.arg("--version");
    
    match check_cmd.output() {
        Ok(_) => {},
        Err(_) => return Err("yt-dlp is not installed or not found in PATH. Please install yt-dlp first.".to_string()),
    }

    let video_url = if video_id.starts_with("http") {
        video_id
    } else {
        format!("https://www.youtube.com/watch?v={}", video_id)
    };

    // Get detailed video information including thumbnails
    let mut cmd = create_hidden_command("yt-dlp");
    cmd.args(&[
        "--dump-json",
        "--no-playlist",
        "--skip-download",
        &video_url
    ]);

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                match serde_json::from_str::<serde_json::Value>(&output_str) {
                    Ok(json) => Ok(json),
                    Err(e) => Err(format!("Failed to parse video details: {}", e)),
                }
            } else {
                let error_str = String::from_utf8_lossy(&output.stderr);
                Err(format!("yt-dlp error: {}", error_str))
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

#[tauri::command]
async fn ytdlp_download(
    url: String,
    output_path: String,
    format: String,
    quality: String,
    audio_only: bool,
    subtitles: bool,
    playlist: bool,
    custom_args: String,
) -> Result<String, String> {
    // Check if yt-dlp is available
    let mut check_cmd = create_hidden_command("yt-dlp");
    check_cmd.arg("--version");
    
    match check_cmd.output() {
        Ok(_) => {},
        Err(_) => return Err("yt-dlp is not installed or not found in PATH. Please install yt-dlp first.".to_string()),
    }

    let mut cmd = create_hidden_command("yt-dlp");
    
    // Set output directory
    let output_template = if audio_only {
        format!("{}/%(title)s.%(ext)s", output_path)
    } else {
        format!("{}/%(title)s.%(ext)s", output_path)
    };
    
    cmd.args(&["-o", &output_template]);

    // Add verbose output for better debugging
    cmd.arg("--verbose");

    // Audio-only options
    if audio_only {
        cmd.args(&["-x", "--audio-format", &format]);
        
        // Audio quality
        match quality.as_str() {
            "best" => cmd.arg("--audio-quality=0"),
            "worst" => cmd.arg("--audio-quality=9"),
            _ => cmd.arg("--audio-quality=0"),
        };
    } else {
        // Video format and quality - check if quality is already a selector or needs mapping
        let format_selector = if quality.contains("[") || quality.contains("+") || quality == "best" || quality == "worst" {
            // Quality is already a yt-dlp selector - use it directly (like Python implementation)
            quality.as_str()
        } else {
            // Legacy quality strings - map to selectors
            match quality.as_str() {
                "1080p" => "bestvideo[height<=1080][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=1080][vcodec^=avc]",
                "720p" => "bestvideo[height<=720][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=720][vcodec^=avc]",
                "480p" => "bestvideo[height<=480][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=480][vcodec^=avc]",
                "360p" => "bestvideo[height<=360][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=360][vcodec^=avc]",
                _ => "best",
            }
        };
        
        cmd.args(&["-f", format_selector]);

        // Use merge-output-format like in the working Python implementation
        // Extract the actual format from the format label or use mp4 as default
        let merge_format = if format.to_lowercase().contains("mp4") || format.to_lowercase().contains("video") {
            "mp4"
        } else if format.to_lowercase().contains("webm") {
            "webm"
        } else if format.to_lowercase().contains("mkv") {
            "mkv"
        } else {
            "mp4" // Default to mp4
        };
        cmd.args(&["--merge-output-format", merge_format]);
    }

    // Subtitle options
    if subtitles {
        cmd.args(&["--write-subs", "--write-auto-subs", "--sub-lang", "en,id"]);
    }

    // Playlist handling
    if !playlist {
        cmd.arg("--no-playlist");
    }

    // Custom arguments
    if !custom_args.trim().is_empty() {
        let args: Vec<&str> = custom_args.split_whitespace().collect();
        cmd.args(&args);
    }

    // Add URL
    cmd.arg(&url);

    // Execute command
    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                Ok(format!("Download completed successfully. Output: {}", output_str))
            } else {
                let error_str = String::from_utf8_lossy(&output.stderr);
                
                // Check if the error is about format not being available
                if error_str.contains("Requested format is not available") {
                    // Try a fallback approach with a more lenient format selector
                    let mut fallback_cmd = create_hidden_command("yt-dlp");
                    
                    fallback_cmd.args(&["-o", &output_template]);
                    fallback_cmd.args(&[
                        "--extractor-args", "youtube:player_client=android",
                        "--verbose", // Keep verbose for debugging
                    ]);
                    
                    if audio_only {
                        fallback_cmd.args(&["-x", "--audio-format", &format]);
                        fallback_cmd.arg("--audio-quality=0");
                    } else {
                        // Use the same advanced format selectors for fallback - like Python implementation
                        let fallback_selector = match quality.as_str() {
                            "1080p" => "bestvideo[height<=1080][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=1080][vcodec^=avc]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
                            "720p" => "bestvideo[height<=720][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=720][vcodec^=avc]/bestvideo[height<=720]+bestaudio/best[height<=720]/best", 
                            "480p" => "bestvideo[height<=480][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=480][vcodec^=avc]/bestvideo[height<=480]+bestaudio/best[height<=480]/best",
                            "360p" => "bestvideo[height<=360][vcodec^=avc]+bestaudio[acodec^=mp4a]/best[height<=360][vcodec^=avc]/bestvideo[height<=360]+bestaudio/best[height<=360]/worst",
                            _ => "best/worst",
                        };
                        
                        fallback_cmd.args(&["-f", fallback_selector]);
                        
                        // Always use merge-output-format for consistency
                        fallback_cmd.args(&["--merge-output-format", &format]);
                    }
                    
                    if subtitles {
                        fallback_cmd.args(&["--write-subs", "--write-auto-subs", "--sub-lang", "en,id"]);
                    }
                    
                    if !playlist {
                        fallback_cmd.arg("--no-playlist");
                    }
                    
                    if !custom_args.trim().is_empty() {
                        let args: Vec<&str> = custom_args.split_whitespace().collect();
                        fallback_cmd.args(&args);
                    }
                    
                    fallback_cmd.arg(&url);
                    
                    // Try the fallback
                    match fallback_cmd.output() {
                        Ok(fallback_output) => {
                            if fallback_output.status.success() {
                                let output_str = String::from_utf8_lossy(&fallback_output.stdout);
                                Ok(format!("Download completed with fallback format. Output: {}", output_str))
                            } else {
                                let fallback_error = String::from_utf8_lossy(&fallback_output.stderr);
                                Err(format!("yt-dlp download failed even with fallback: Original error: {}\nFallback error: {}", error_str, fallback_error))
                            }
                        }
                        Err(e) => Err(format!("yt-dlp download failed: {}\nFallback execution failed: {}", error_str, e)),
                    }
                } else {
                    Err(format!("yt-dlp download failed: {}", error_str))
                }
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

#[tauri::command]
async fn check_ytdlp() -> Result<String, String> {
    let mut cmd = create_hidden_command("yt-dlp");
    cmd.arg("--version");
    
    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                Ok(version.trim().to_string())
            } else {
                Err("yt-dlp is installed but not working properly".to_string())
            }
        }
        Err(_) => Err("yt-dlp is not installed or not found in PATH".to_string()),
    }
}

#[tauri::command]
async fn ytdlp_list_formats(url: String) -> Result<String, String> {
    let mut cmd = create_hidden_command("yt-dlp");
    cmd.args(&[
        "-F", // List all available formats
        "--extractor-args", "youtube:player_client=android",
        &url
    ]);

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                let error_str = String::from_utf8_lossy(&output.stderr);
                Err(format!("Failed to list formats: {}", error_str))
            }
        }
        Err(e) => Err(format!("Failed to execute yt-dlp: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet, 
            download_file, 
            select_directory, 
            scan_media_files, 
            get_file_url,
            toggle_fullscreen,
            get_media_duration,
            open_file_location,
            check_ffmpeg,
            calculate_loops,
            loop_media,
            get_video_info,
            resize_video,
            convert_video,
            convert_audio,
            reduce_noise,
            ytdlp_get_info,
            ytdlp_get_playlist_info,
            ytdlp_get_video_details,
            ytdlp_download,
            ytdlp_list_formats,
            check_ytdlp
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
