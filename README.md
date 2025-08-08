# Yeyo - Media Management & Download Application

A powerful desktop application built with Tauri, React, and TypeScript for media management, conversion, and downloading from various platforms including YouTube.

## Features

- 🎥 **Media File Management** - Browse, organize, and play local media files
- 📺 **YouTube Download** - Download videos and audio from YouTube with quality selection
- 🔄 **Media Conversion** - Convert between different video and audio formats
- 🎵 **Audio Processing** - Extract audio from video, noise reduction, format conversion
- 📱 **Social Media Downloads** - Download content from Instagram, Facebook, and other platforms
- 🎚️ **Advanced Controls** - Loop media with custom settings, resize videos
- 🎨 **Modern UI** - Clean, responsive interface with dark/light theme support

## Requirements

### System Requirements
- **Windows 10/11** (primary support)
- **macOS 10.15+** or **Linux** (experimental)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for application, additional space for downloads

### Required Dependencies

#### Essential Tools
1. **yt-dlp** (required for YouTube downloads)
   ```bash
   # Install via pip (recommended)
   pip install yt-dlp
   
   # Or via package manager
   # Windows (Chocolatey): choco install yt-dlp
   # macOS (Homebrew): brew install yt-dlp
   # Ubuntu/Debian: sudo apt install yt-dlp
   ```

2. **FFmpeg** (required for media conversion)
   ```bash
   # Windows (Chocolatey): choco install ffmpeg
   # macOS (Homebrew): brew install ffmpeg
   # Ubuntu/Debian: sudo apt install ffmpeg
   ```

#### Development Requirements (for building from source)
- **Node.js** 18+ and **pnpm**
- **Rust** 1.70+ with Cargo
- **Tauri CLI**
  ```bash
  cargo install tauri-cli
  ```

### Installation Verification
Verify all dependencies are installed correctly:
```bash
# Check yt-dlp
yt-dlp --version

# Check FFmpeg
ffmpeg -version

# Check Node.js
node --version

# Check Rust
rustc --version
```

## Installation

### Pre-built Releases (Recommended)
1. Download the latest release from [Releases](https://github.com/Nazril08/yeyo/releases)
2. Install the appropriate package for your OS:
   - Windows: `.msi` installer
   - macOS: `.dmg` package
   - Linux: `.deb` or `.AppImage`

### Building from Source
1. **Clone the repository**
   ```bash
   git clone https://github.com/Nazril08/yeyo.git
   cd yeyo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build and run**
   ```bash
   # Development mode
   pnpm tauri dev
   
   # Production build
   pnpm tauri build
   ```

## Usage

### YouTube Downloads
1. Open the **YTDLP Download Manager** tab
2. Paste a YouTube URL
3. Select desired quality (240p to 4K)
4. Choose output directory
5. Click **Download**

**Note**: The application uses optimized format selectors that avoid YouTube's SABR streaming restrictions for reliable high-quality downloads.

### Media Conversion
1. Navigate to **Media Converter** section
2. Select input file(s)
3. Choose output format and quality settings
4. Configure advanced options if needed
5. Start conversion

### Audio Processing
1. Go to **Audio Tools**
2. Select audio file or extract from video
3. Choose processing options (noise reduction, format conversion)
4. Apply settings and save

## Troubleshooting

### YouTube Download Issues
- **403 Forbidden errors**: The app automatically handles this with fallback logic
- **Quality not as expected**: Try different quality settings or check available formats
- **Slow downloads**: Ensure stable internet connection and sufficient disk space

### Media Conversion Problems
- **FFmpeg not found**: Verify FFmpeg is installed and in system PATH
- **Unsupported format**: Check FFmpeg format support
- **Conversion fails**: Try different codec settings or update FFmpeg

### Common Solutions
1. **Restart the application** if downloads get stuck
2. **Update yt-dlp** regularly for YouTube compatibility:
   ```bash
   pip install --upgrade yt-dlp
   ```
3. **Check system PATH** includes FFmpeg and yt-dlp locations

## Development

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Rust, Tauri
- **Media Processing**: FFmpeg
- **Downloads**: yt-dlp

### Project Structure
```
yeyo/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── dashboard/         # Main application screens
│   └── styles/           # CSS and styling
├── src-tauri/            # Rust backend
│   └── src/main.rs       # Tauri commands and logic
└── public/               # Static assets
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube download engine  
- [FFmpeg](https://ffmpeg.org/) - Media processing
- [shadcn/ui](https://ui.shadcn.com/) - UI components

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
