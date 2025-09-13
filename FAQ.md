# Frequently Asked Questions (FAQ)

## General Questions

### What is AcademicQuest Fresh?
AcademicQuest Fresh is a modern, gamified academic planning and productivity application designed to help students organize their academic journey. It combines course planning, task management, study tools, and achievement tracking in one comprehensive platform.

### Is AcademicQuest Fresh free?
Yes! AcademicQuest Fresh is completely free and open-source under the MIT License. You can use it, modify it, and distribute it without any cost.

### What platforms does it support?
AcademicQuest Fresh runs on:
- **Windows** 10/11 (x64)
- **macOS** 10.15+ (Intel and Apple Silicon)
- **Linux** (x64, ARM64)

### Do I need an internet connection?
An internet connection is required for:
- Initial download and installation
- Checking for updates
- Some advanced features

However, the core functionality works offline once installed.

## Installation Questions

### How do I install AcademicQuest Fresh?
See our detailed [Installation Guide](INSTALLATION.md) for step-by-step instructions for your platform.

### Can I install it on multiple computers?
Yes! You can install AcademicQuest Fresh on as many computers as you want. Your data is stored locally on each device.

### Do I need to install anything else first?
You need:
- **For users**: Just download and install the application
- **For developers**: Node.js, Rust, and Git (see [Installation Guide](INSTALLATION.md))

### Why won't the app start on macOS?
If you get a security warning on macOS:
1. Go to System Preferences > Security & Privacy > General
2. Click "Open Anyway" next to the AcademicQuest Fresh message
3. Or right-click the app and select "Open"

## Data and Storage

### Where is my data stored?
Your data is stored locally on your computer:
- **Windows**: `%APPDATA%\AcademicQuest-Fresh\`
- **macOS**: `~/Library/Application Support/AcademicQuest-Fresh/`
- **Linux**: `~/.local/share/AcademicQuest-Fresh/`

### Can I backup my data?
Yes! You can:
1. Copy the data directory to another location
2. Use the built-in export features (coming soon)
3. Sync the data directory with cloud storage

### Will my data be lost if I uninstall?
Yes, uninstalling will remove your data. Make sure to backup your data directory before uninstalling if you want to keep your information.

### Can I sync data between devices?
Currently, data sync between devices is not built-in. You can manually copy your data directory between devices, or use cloud storage to sync the data folder.

## Features and Usage

### How do I create my first course?
1. Go to the Course Planner page
2. Click "Add Year" to create an academic year
3. Add terms (Fall, Spring, Summer) to your year
4. Click "Add Course" within a term
5. Fill in course details and start adding modules

### What are study streaks?
Study streaks track consecutive days of study activity. They help maintain motivation and build consistent study habits. You can freeze streaks during breaks to preserve your progress.

### How do achievements work?
Achievements are unlocked by completing various academic milestones:
- Completing courses
- Maintaining study streaks
- Reaching study hour goals
- Using different features consistently

### Can I customize the interface?
Yes! You can:
- Switch between light and dark themes
- Customize sound effects and background music
- Adjust notification settings
- Modify the layout of some components

### How do I use the Pomodoro timer?
1. Go to the Pomodoro Float component
2. Set your work and break durations
3. Click start to begin a focused study session
4. Take breaks when prompted
5. Track your productivity over time

## Technical Questions

### What technologies does it use?
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Tauri 2.0 (Rust)
- **State Management**: Zustand
- **Build System**: Vite

### Can I contribute to the project?
Absolutely! See our [Contributing Guide](CONTRIBUTING.md) for details on how to get involved.

### How do I report bugs?
1. Check if the issue already exists on [GitHub Issues](https://github.com/Rensjo/AcademicQuest-Fresh/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Your operating system and version
   - Any error messages

### How do I request features?
Use [GitHub Discussions](https://github.com/Rensjo/AcademicQuest-Fresh/discussions) to suggest new features or improvements.

## Troubleshooting

### The app won't start
Try these solutions:
1. **Windows**: Check Windows Defender or antivirus settings
2. **macOS**: Allow the app in Security & Privacy settings
3. **Linux**: Ensure the AppImage is executable (`chmod +x`)
4. Restart your computer
5. Reinstall the application

### I'm getting data corruption errors
1. Close the application
2. Clear the application data directory
3. Restart the application
4. If the problem persists, reinstall and restore from backup

### The app is running slowly
1. Close other applications to free up memory
2. Check available disk space
3. Restart the application
4. Update to the latest version

### Sound effects aren't working
1. Check your system volume and mute settings
2. Ensure the application has audio permissions
3. Try different sound settings in the app
4. Restart the application

### I can't find my data
1. Check the data directory locations listed above
2. Search for "AcademicQuest-Fresh" on your computer
3. Check if the data is in a different user account
4. Look in the Recycle Bin/Trash if you accidentally deleted it

## Privacy and Security

### Is my data private?
Yes! All your data is stored locally on your computer. We don't collect or transmit any personal information.

### Is the app secure?
AcademicQuest Fresh is built with security in mind:
- All data is stored locally
- No network transmission of personal data
- Regular security updates
- Open-source code for transparency

### Can I use it offline?
Yes! Once installed, AcademicQuest Fresh works completely offline. You only need internet for updates.

## Performance

### How much disk space does it use?
The application itself uses about 100-200MB. Your data size depends on usage but is typically very small (a few MB).

### How much memory does it use?
Typically 50-150MB of RAM, depending on the amount of data and active features.

### Will it slow down my computer?
No, AcademicQuest Fresh is designed to be lightweight and efficient. It should have minimal impact on system performance.

## Updates and Maintenance

### How do I update the app?
The app will notify you when updates are available. You can also check the [Releases page](https://github.com/Rensjo/AcademicQuest-Fresh/releases) for new versions.

### Will updates affect my data?
Updates are designed to preserve your data. However, it's always good practice to backup your data before major updates.

### How often are updates released?
Updates are released as needed for bug fixes and new features. Major updates typically come every few months.

---

**Still have questions?** 
- Check our [GitHub Issues](https://github.com/Rensjo/AcademicQuest-Fresh/issues)
- Join our [Discussions](https://github.com/Rensjo/AcademicQuest-Fresh/discussions)
- Contact us directly

*We're here to help make your academic journey more organized and productive!*
