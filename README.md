# AcademicQuest Fresh

A modern, gamified academic planning and productivity application built with Tauri and React. Transform your academic journey with intelligent course planning, task management, and achievement tracking.

![AcademicQuest Fresh](https://img.shields.io/badge/version-0.0.1-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎯 **Academic Planning**
- **Course Planner**: Organize courses by year and term with detailed module tracking
- **Academic Calendar**: Visual calendar integration for scheduling and deadlines
- **Schedule Planner**: Create and manage your class schedules
- **Textbook Management**: Track required and recommended textbooks

### 🎮 **Gamification**
- **Achievement System**: Unlock badges and rewards for academic milestones
- **Study Streaks**: Track consecutive study days and maintain motivation
- **Level Progression**: Level up as you complete courses and tasks
- **Streak Freeze**: Preserve your study streaks during breaks

### 📚 **Study Tools**
- **Rich Text Editor**: Take detailed notes with formatting and organization
- **Pomodoro Timer**: Focused study sessions with built-in timer
- **Task Management**: Create, organize, and track academic tasks
- **Study Hours Tracking**: Monitor your study time and productivity

### 🎵 **Enhanced Experience**
- **Background Music**: Customizable ambient sounds for focus
- **Sound Effects**: Audio feedback for interactions and achievements
- **Dark/Light Theme**: Adaptive theming for comfortable studying
- **Notifications**: Smart reminders and achievement notifications

### 💰 **Scholarship Tracking**
- **Scholarship Database**: Discover and track scholarship opportunities
- **Application Management**: Organize scholarship applications and deadlines
- **Progress Tracking**: Monitor application status and requirements

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Rust** 1.70+ (for Tauri development)
- **Git** for cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rensjo/AcademicQuest-Fresh.git
   cd AcademicQuest-Fresh
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd web && npm install && cd ..
   ```

3. **Run in development mode**
   ```bash
   npm run dev:tauri
   ```

4. **Build for production**
   ```bash
   npm run build:tauri
   ```

## 📖 Detailed Installation

For comprehensive installation instructions, see [INSTALLATION.md](INSTALLATION.md).

## 🏗️ Development

### Project Structure
```
AcademicQuest-Fresh/
├── web/                    # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── store/         # Zustand state management
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/               # Rust source code
│   └── icons/             # Application icons
└── .github/workflows/     # GitHub Actions CI/CD
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:web` | Start web development server |
| `npm run dev:tauri` | Start Tauri development mode |
| `npm run build:web` | Build web frontend for production |
| `npm run build:tauri` | Build complete Tauri application |

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Tauri 2.0 (Rust)
- **State Management**: Zustand with persistence
- **UI Components**: Custom components with shadcn/ui
- **Build Tool**: Vite
- **Package Manager**: npm

## 📱 Supported Platforms

- **Windows** 10/11 (x64)
- **macOS** 10.15+ (Intel and Apple Silicon)
- **Linux** (x64, ARM64)

## 🎨 Customization

### Themes
AcademicQuest Fresh supports both light and dark themes with automatic system detection.

### Icons
Custom application icons are included for all platforms:
- Windows: `.ico` format
- macOS: `.icns` format
- Linux: `.png` format

### Sound Effects
Customizable audio feedback system with:
- Background music
- UI interaction sounds
- Achievement notifications
- Study session alerts

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri** for the excellent desktop app framework
- **React** and **TypeScript** for the frontend foundation
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Vite** for fast development and building

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Rensjo/AcademicQuest-Fresh/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Rensjo/AcademicQuest-Fresh/discussions)
- **Email**: [Your contact email]

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Made with ❤️ for students by students**

*Transform your academic journey with AcademicQuest Fresh!*
