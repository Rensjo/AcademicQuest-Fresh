# Changelog

All notable changes to AcademicQuest Fresh will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflow for automated macOS DMG builds
- Comprehensive documentation (README, Installation Guide, License)
- Data persistence improvements with validation and migration
- Enhanced error handling and recovery mechanisms

### Changed
- Updated Tauri configuration for macOS bundle targets
- Improved data storage reliability and corruption handling
- Enhanced user experience with better error messages

### Fixed
- Resolved data loss issues in CoursePlanner text areas
- Fixed Tauri build configuration for cross-platform compatibility
- Improved artifact upload paths in CI/CD pipeline

## [0.0.1] - 2024-01-13

### Added
- Initial release of AcademicQuest Fresh
- **Academic Planning Features**
  - Course Planner with year/term organization
  - Academic Calendar integration
  - Schedule Planner for class management
  - Textbook tracking and management
- **Gamification System**
  - Achievement system with badges and rewards
  - Study streak tracking and maintenance
  - Level progression based on academic milestones
  - Streak freeze functionality for breaks
- **Study Tools**
  - Rich text editor for detailed note-taking
  - Pomodoro timer for focused study sessions
  - Task management and organization
  - Study hours tracking and analytics
- **Enhanced User Experience**
  - Background music and sound effects
  - Dark/light theme support
  - Smart notification system
  - Customizable audio feedback
- **Scholarship Management**
  - Scholarship discovery and tracking
  - Application management and deadlines
  - Progress monitoring and status updates
- **Cross-Platform Support**
  - Windows 10/11 (x64)
  - macOS 10.15+ (Intel and Apple Silicon)
  - Linux (x64, ARM64)
- **Technical Features**
  - Tauri 2.0 framework for native performance
  - React 18 with TypeScript
  - Zustand state management with persistence
  - Tailwind CSS for modern styling
  - Vite for fast development and building

### Technical Details
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Tauri 2.0 (Rust)
- **State Management**: Zustand with localStorage persistence
- **Build System**: Vite
- **Package Manager**: npm
- **CI/CD**: GitHub Actions

### Known Issues
- Data persistence warnings may appear on first launch
- Some sound effects may not work on Linux systems
- Large course modules may cause slight performance delays

---

## Version History Summary

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| 0.0.1   | 2024-01-13   | Initial release with core academic planning features |
| Unreleased | TBD | Enhanced CI/CD, improved data persistence, comprehensive documentation |

## Migration Notes

### From 0.0.0 to 0.0.1
- This is the initial release, no migration needed
- All data will be stored locally using browser localStorage
- Backup your data before major updates

### Future Versions
- Data migration will be handled automatically
- Backup recommendations will be provided for major version updates
- Breaking changes will be clearly documented

## Contributing

When contributing to this project, please update this changelog with your changes following the format above.

### Changelog Format
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

*For more information about AcademicQuest Fresh, visit our [GitHub repository](https://github.com/Rensjo/AcademicQuest-Fresh).*
