// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::{self, File, DirEntry};
use std::io::copy;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use std::process::Command;
use reqwest;
use tokio;
use serde::{Deserialize, Serialize};
use tauri::{Manager, Window};

#[derive(Debug, Serialize, Deserialize)]
struct MediaFile {
    name: String,
    path: String,
    size: u64,
    modified: u64,
    #[serde(rename = "type")]
    file_type: String,
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
    let output = Command::new("ffprobe")
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
    let output = Command::new("ffmpeg")
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
    let mut cmd = Command::new("ffmpeg");
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
            loop_media
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
