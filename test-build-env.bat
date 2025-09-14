@echo off
REM Test script to verify build environment matches CI/CD setup (Windows)

echo 🔧 AcademicQuest Build Environment Test (Windows)
echo ====================================================

set "errors=0"

REM Function to check if command exists
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js installed
) else (
    echo ❌ Node.js not found
    set /a errors+=1
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ npm installed
) else (
    echo ❌ npm not found
    set /a errors+=1
)

where cargo >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Rust/Cargo installed
) else (
    echo ❌ Rust/Cargo not found
    set /a errors+=1
)

where git >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Git installed
) else (
    echo ❌ Git not found
    set /a errors+=1
)

echo.
echo Checking Node.js version...
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
if defined NODE_VERSION (
    echo ✅ Node.js version: %NODE_VERSION%
) else (
    echo ❌ Could not determine Node.js version
    set /a errors+=1
)

echo.
echo Checking Tauri setup...

REM Check if tauri command is available
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"
where tauri >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('tauri --version 2^>nul') do set TAURI_VERSION=%%i
    if defined TAURI_VERSION (
        echo ✅ Tauri CLI installed: %TAURI_VERSION%
    ) else (
        echo ❌ Tauri CLI found but version check failed
        set /a errors+=1
    )
) else (
    echo ❌ Tauri CLI not installed
    echo 💡 To install: cargo install tauri-cli --version ^2.0
    set /a errors+=1
)

echo.
echo Checking project dependencies...

if exist package.json (
    echo ✅ Root package.json found
) else (
    echo ❌ Root package.json not found
    set /a errors+=1
)

if exist node_modules (
    echo ✅ Root node_modules exists
) else (
    echo ❌ Root node_modules missing - run 'npm install'
    set /a errors+=1
)

if exist web\package.json (
    echo ✅ Web package.json found
) else (
    echo ❌ Web package.json not found
    set /a errors+=1
)

if exist web\node_modules (
    echo ✅ Web node_modules exists
) else (
    echo ❌ Web node_modules missing - run 'cd web && npm install'
    set /a errors+=1
)

if exist src-tauri\tauri.conf.json (
    echo ✅ Tauri configuration found
) else (
    echo ❌ Tauri configuration missing
    set /a errors+=1
)

echo.
echo Testing build commands...
where tauri >nul 2>nul
if %errorlevel% equ 0 (
    tauri info >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Tauri info command works
    ) else (
        echo ❌ Tauri info command failed
        set /a errors+=1
    )
) else (
    echo ❌ Cannot test tauri commands - CLI not installed
    set /a errors+=1
)

echo.
echo Summary
echo =======
if %errors% equ 0 (
    echo 🎉 All checks passed! Your environment should work with CI/CD.
) else (
    echo ⚠️  Found %errors% issues. Please fix them before building.
)

echo.
echo Quick setup commands:
echo - Install Tauri CLI: cargo install tauri-cli --version ^2.0
echo - Install deps: npm install ^&^& cd web ^&^& npm install
echo - Run dev server: npm run dev:tauri
echo - Build app: npm run build:tauri

pause
