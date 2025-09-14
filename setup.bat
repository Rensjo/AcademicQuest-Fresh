@echo off
REM Setup script for AcademicQuest development environment on Windows

echo Setting up AcademicQuest development environment...

REM Check if Rust is installed
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Rust is not installed. Please install Rust first: https://rustup.rs/
    exit /b 1
)

REM Check if Node.js is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first: https://nodejs.org/
    exit /b 1
)

echo ✅ Rust and Node.js found

REM Install Tauri CLI
echo 📦 Installing Tauri CLI...
cargo install tauri-cli --version ^2.0

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd web && npm install && cd ..

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

echo 🎉 Setup complete! You can now run:
echo   npm run dev:tauri    - Start development server
echo   npm run build:tauri  - Build for production
pause
