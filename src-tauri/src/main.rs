// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::{self, File, DirEntry};
use std::io::copy;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
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
            get_file_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
