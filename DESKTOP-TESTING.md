# AcademicQuest Desktop App Testing Guide

## 🚀 Quick Start Commands

### For Testing the Desktop App Locally:

1. **Start Web Development Server**
   ```bash
   cd web
   npm run dev
   ```

2. **Run Desktop App (Option A - Recommended)**
   ```bash
   cd src-tauri
   cargo run
   ```

3. **Run Desktop App (Option B - Using npm)**
   ```bash
   npm run dev:tauri
   ```

### For Building Production Version:

1. **Build Web Frontend**
   ```bash
   cd web
   npm run build
   ```

2. **Build Desktop App**
   ```bash
   cargo tauri build
   ```

## 🔧 Development Workflow

### Daily Development:
1. Keep web dev server running in one terminal: `cd web && npm run dev`
2. Run desktop app in another terminal: `cd src-tauri && cargo run`
3. Make changes to React code - hot reload works automatically
4. Restart desktop app only when changing Rust code

### Testing Features:
- **Window Resizing**: Test 1280x800 default and resize behavior
- **Web Integration**: Verify React app loads correctly in desktop
- **File Dialogs**: Test any file operations (if implemented)
- **System Integration**: Check notifications, tray icons, etc.
- **Performance**: Compare desktop vs web performance

### Common Issues & Solutions:

**Desktop app won't start:**
- Check if web server is running on port 5173
- Verify frontend is built: `cd web && npm run build`
- Check Tauri config: `src-tauri/tauri.conf.json`

**Hot reload not working:**
- Make sure `devUrl` in tauri.conf.json points to `http://localhost:5173`
- Restart both web server and desktop app

**Build errors:**
- Run environment test: `.\test-build-env.bat` (Windows) or `./test-build-env.sh` (Linux/Mac)
- Install Tauri CLI: `cargo install tauri-cli --version ^2.0`
- Update dependencies: `cd web && npm install`

## 🎯 What to Test

### Core Functionality:
- [ ] Application launches successfully
- [ ] All pages load (Course Planner, Schedule, etc.)
- [ ] Navigation works between pages
- [ ] Data persistence (Zustand stores)
- [ ] Theme switching (light/dark)
- [ ] Responsive layout

### Desktop-Specific Features:
- [ ] Window controls (minimize, maximize, close)
- [ ] Window resizing and positioning
- [ ] System tray integration (if implemented)
- [ ] File system access (if implemented)
- [ ] Native notifications (if implemented)
- [ ] Keyboard shortcuts

### Performance Testing:
- [ ] App startup time
- [ ] Memory usage
- [ ] CPU usage during normal operation
- [ ] Large dataset handling

## 📊 Debugging Tips

### View Console Logs:
- Open DevTools in desktop app: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Or enable in tauri.conf.json: `"devtools": true`

### Check Tauri Logs:
- Rust logs appear in terminal where you ran `cargo run`
- Web logs appear in browser DevTools

### Build Information:
- Check build output: `cargo tauri info`
- List targets: `rustup target list --installed`
- Verify dependencies: `cargo tree` (from src-tauri directory)

## 🏗️ Next Steps After Testing

1. **If everything works**: Ready for production builds and distribution
2. **If issues found**: Use this guide to debug and fix
3. **For CI/CD**: The GitHub Actions are now fixed and should work
4. **For distribution**: Consider code signing and update mechanisms

## 📝 Notes

- First build takes 5-10 minutes (compiling many dependencies)
- Subsequent builds are much faster (incremental compilation)
- Desktop app size will be ~50-100MB (includes Chromium engine)
- Windows requires WebView2 (usually pre-installed on Windows 10+)
