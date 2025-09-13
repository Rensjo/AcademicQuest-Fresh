# Installation Guide

This guide provides detailed installation instructions for AcademicQuest Fresh on all supported platforms.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Internet**: Required for initial setup and updates

### Development Requirements (for building from source)
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Rust**: 1.70.0 or higher
- **Git**: 2.30.0 or higher

## 🪟 Windows Installation

### Method 1: Download Pre-built Binary (Recommended)

1. **Download the installer**
   - Go to the [Releases page](https://github.com/Rensjo/AcademicQuest-Fresh/releases)
   - Download `AcademicQuest-Fresh_0.0.1_x64_en-US.msi` for Windows

2. **Run the installer**
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - Choose installation directory (default: `C:\Program Files\AcademicQuest-Fresh`)

3. **Launch the application**
   - Find "AcademicQuest Fresh" in your Start menu
   - Or run from desktop shortcut

### Method 2: Build from Source

1. **Install Prerequisites**
   ```powershell
   # Install Node.js from https://nodejs.org/
   # Install Rust from https://rustup.rs/
   
   # Verify installations
   node --version
   npm --version
   rustc --version
   ```

2. **Clone and Build**
   ```powershell
   git clone https://github.com/Rensjo/AcademicQuest-Fresh.git
   cd AcademicQuest-Fresh
   npm install
   cd web && npm install && cd ..
   npm run build:tauri
   ```

3. **Find the built application**
   - Look in `src-tauri/target/release/bundle/msi/`
   - Run the generated `.msi` installer

## 🍎 macOS Installation

### Method 1: Download Pre-built Binary (Recommended)

1. **Download the DMG**
   - Go to the [Releases page](https://github.com/Rensjo/AcademicQuest-Fresh/releases)
   - Download `AcademicQuest-Fresh_0.0.1_aarch64.dmg` (Apple Silicon) or `AcademicQuest-Fresh_0.0.1_x64.dmg` (Intel)

2. **Install the application**
   - Double-click the downloaded `.dmg` file
   - Drag "AcademicQuest Fresh" to your Applications folder
   - Eject the DMG when done

3. **Launch the application**
   - Open Applications folder
   - Double-click "AcademicQuest Fresh"
   - If you get a security warning, go to System Preferences > Security & Privacy > General and click "Open Anyway"

### Method 2: Build from Source

1. **Install Prerequisites**
   ```bash
   # Install Homebrew (if not already installed)
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Node.js and Rust
   brew install node rust
   
   # Verify installations
   node --version
   npm --version
   rustc --version
   ```

2. **Clone and Build**
   ```bash
   git clone https://github.com/Rensjo/AcademicQuest-Fresh.git
   cd AcademicQuest-Fresh
   npm install
   cd web && npm install && cd ..
   npm run build:tauri
   ```

3. **Find the built application**
   - Look in `src-tauri/target/release/bundle/dmg/`
   - Mount the generated `.dmg` file and install

## 🐧 Linux Installation

### Method 1: Download Pre-built Binary (Recommended)

1. **Download the AppImage**
   - Go to the [Releases page](https://github.com/Rensjo/AcademicQuest-Fresh/releases)
   - Download `AcademicQuest-Fresh_0.0.1_amd64.AppImage` (x64) or `AcademicQuest-Fresh_0.0.1_arm64.AppImage` (ARM64)

2. **Make it executable and run**
   ```bash
   chmod +x AcademicQuest-Fresh_0.0.1_amd64.AppImage
   ./AcademicQuest-Fresh_0.0.1_amd64.AppImage
   ```

3. **Optional: Install system-wide**
   ```bash
   sudo mv AcademicQuest-Fresh_0.0.1_amd64.AppImage /usr/local/bin/academicquest-fresh
   sudo chmod +x /usr/local/bin/academicquest-fresh
   ```

### Method 2: Build from Source

1. **Install Prerequisites**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm curl build-essential
   
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   
   # Verify installations
   node --version
   npm --version
   rustc --version
   ```

2. **Clone and Build**
   ```bash
   git clone https://github.com/Rensjo/AcademicQuest-Fresh.git
   cd AcademicQuest-Fresh
   npm install
   cd web && npm install && cd ..
   npm run build:tauri
   ```

3. **Find the built application**
   - Look in `src-tauri/target/release/bundle/appimage/`
   - Run the generated `.AppImage` file

## 🔧 Development Installation

### Full Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rensjo/AcademicQuest-Fresh.git
   cd AcademicQuest-Fresh
   ```

2. **Install all dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install web dependencies
   cd web
   npm install
   cd ..
   ```

3. **Start development mode**
   ```bash
   # Start both web server and Tauri app
   npm run dev:tauri
   
   # Or start only web development server
   npm run dev:web
   ```

4. **Build for production**
   ```bash
   # Build complete application
   npm run build:tauri
   
   # Or build only web frontend
   npm run build:web
   ```

## 🚨 Troubleshooting

### Common Issues

#### "Command not found" errors
- **Windows**: Make sure Node.js and Rust are in your PATH
- **macOS**: Try restarting Terminal after installing via Homebrew
- **Linux**: Ensure packages are properly installed and PATH is updated

#### Build failures
- **Rust compilation errors**: Update Rust to latest version with `rustup update`
- **Node.js errors**: Clear npm cache with `npm cache clean --force`
- **Permission errors**: Run with appropriate permissions or use `sudo` (Linux/macOS)

#### Application won't start
- **Windows**: Check Windows Defender or antivirus software
- **macOS**: Allow the app in Security & Privacy settings
- **Linux**: Ensure all dependencies are installed and AppImage is executable

#### Data persistence issues
- Check that the application has write permissions to its data directory
- Clear application data and restart if corrupted
- Check available disk space

### Getting Help

1. **Check the logs**
   - Windows: `%APPDATA%\AcademicQuest-Fresh\logs\`
   - macOS: `~/Library/Logs/AcademicQuest-Fresh/`
   - Linux: `~/.local/share/AcademicQuest-Fresh/logs/`

2. **Report issues**
   - Create an issue on [GitHub](https://github.com/Rensjo/AcademicQuest-Fresh/issues)
   - Include your operating system, version, and error messages

3. **Community support**
   - Join discussions on [GitHub Discussions](https://github.com/Rensjo/AcademicQuest-Fresh/discussions)

## 🔄 Updating

### Automatic Updates
AcademicQuest Fresh will check for updates on startup and notify you when new versions are available.

### Manual Updates
1. Download the latest version from the [Releases page](https://github.com/Rensjo/AcademicQuest-Fresh/releases)
2. Follow the installation instructions for your platform
3. Your data will be preserved during updates

## 🗑️ Uninstallation

### Windows
1. Go to Settings > Apps > Apps & features
2. Find "AcademicQuest Fresh" and click "Uninstall"
3. Or use Control Panel > Programs and Features

### macOS
1. Open Applications folder
2. Drag "AcademicQuest Fresh" to Trash
3. Empty Trash to complete removal

### Linux
```bash
# Remove AppImage
rm ~/AcademicQuest-Fresh_*.AppImage

# Remove system-wide installation
sudo rm /usr/local/bin/academicquest-fresh

# Remove data (optional)
rm -rf ~/.local/share/AcademicQuest-Fresh
```

## 📁 Data Storage

AcademicQuest Fresh stores your data locally:

- **Windows**: `%APPDATA%\AcademicQuest-Fresh\`
- **macOS**: `~/Library/Application Support/AcademicQuest-Fresh/`
- **Linux**: `~/.local/share/AcademicQuest-Fresh/`

Your data includes:
- Course plans and modules
- Task lists and progress
- Study sessions and streaks
- Settings and preferences
- Achievement progress

---

**Need more help?** Check our [FAQ](FAQ.md) or [contact support](https://github.com/Rensjo/AcademicQuest-Fresh/issues).
