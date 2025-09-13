#!/bin/bash
# Setup script for AcademicQuest-Fresh development environment

echo "Setting up AcademicQuest-Fresh development environment..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first: https://rustup.rs/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo "✅ Rust and Node.js found"

# Install Tauri CLI
echo "📦 Installing Tauri CLI..."
cargo install tauri-cli --version ^2.0

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd web && npm install && cd ..

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

echo "🎉 Setup complete! You can now run:"
echo "  npm run dev:tauri    - Start development server"
echo "  npm run build:tauri  - Build for production"
