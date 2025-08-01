// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::File;
use std::io::copy;
use reqwest;
use tokio;

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
        .invoke_handler(tauri::generate_handler![greet, download_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
