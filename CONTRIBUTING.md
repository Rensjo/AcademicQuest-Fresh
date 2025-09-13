# Contributing to AcademicQuest Fresh

Thank you for your interest in contributing to AcademicQuest Fresh! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/Rensjo/AcademicQuest-Fresh/issues) page
- Search existing issues before creating new ones
- Use clear, descriptive titles
- Include steps to reproduce bugs
- Specify your operating system and version

### Suggesting Features
- Use the [GitHub Discussions](https://github.com/Rensjo/AcademicQuest-Fresh/discussions) for feature requests
- Check existing discussions first
- Provide detailed descriptions of proposed features
- Consider the impact on existing functionality

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Rust 1.70+
- Git

### Getting Started
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/AcademicQuest-Fresh.git
cd AcademicQuest-Fresh

# Install dependencies
npm install
cd web && npm install && cd ..

# Start development server
npm run dev:tauri
```

## 📝 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Use Prettier for code formatting

### React Components
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow the existing component structure

### Rust Code
- Follow Rust naming conventions
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Add documentation comments
- Handle errors appropriately

## 🧪 Testing

### Frontend Testing
- Write unit tests for utility functions
- Test component behavior with React Testing Library
- Test user interactions and edge cases
- Maintain good test coverage

### Backend Testing
- Write unit tests for Rust functions
- Test error handling scenarios
- Test integration with Tauri APIs
- Use `cargo test` to run tests

## 📚 Documentation

### Code Documentation
- Document all public APIs
- Use clear, concise comments
- Update documentation when changing APIs
- Include examples for complex functions

### User Documentation
- Update README.md for new features
- Add installation instructions for new dependencies
- Update CHANGELOG.md for all changes
- Keep INSTALLATION.md current

## 🎨 UI/UX Guidelines

### Design Principles
- Follow Material Design principles
- Maintain consistency with existing UI
- Ensure accessibility compliance
- Test on different screen sizes
- Consider dark/light theme compatibility

### Component Guidelines
- Use existing UI components when possible
- Create reusable components for common patterns
- Follow the established design system
- Test components in isolation

## 🔍 Code Review Process

### For Contributors
- Ensure all tests pass
- Update documentation as needed
- Follow coding standards
- Respond to review feedback promptly
- Keep PRs focused and small when possible

### For Reviewers
- Be constructive and respectful
- Focus on code quality and functionality
- Test the changes locally when possible
- Provide clear feedback and suggestions
- Approve when ready for merge

## 🐛 Bug Reports

### Before Reporting
- Check if the issue already exists
- Try the latest version
- Test on different platforms if possible
- Gather relevant system information

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**System Information**
- OS: [e.g. Windows 11, macOS 13, Ubuntu 22.04]
- Version: [e.g. 0.0.1]
- Browser: [if applicable]

**Additional context**
Any other context about the problem.
```

## ✨ Feature Requests

### Before Requesting
- Check existing discussions and issues
- Consider if the feature fits the project's scope
- Think about implementation complexity
- Consider user impact and benefits

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Any other context or screenshots about the feature request.
```

## 📋 Pull Request Guidelines

### PR Title
- Use clear, descriptive titles
- Start with a verb (Add, Fix, Update, Remove)
- Keep under 50 characters
- Reference issues when applicable

### PR Description
- Describe what changes were made
- Explain why the changes were necessary
- Reference any related issues
- Include screenshots for UI changes
- List any breaking changes

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Changes are backwards compatible

## 🏷️ Release Process

### Version Numbering
- Follow Semantic Versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)

### Release Checklist
- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Update documentation
- [ ] Run full test suite
- [ ] Build for all platforms
- [ ] Create GitHub release
- [ ] Update installation instructions

## 🤔 Questions?

- **General Questions**: Use [GitHub Discussions](https://github.com/Rensjo/AcademicQuest-Fresh/discussions)
- **Bug Reports**: Use [GitHub Issues](https://github.com/Rensjo/AcademicQuest-Fresh/issues)
- **Security Issues**: Email [security contact] (don't use public issues)

## 📄 License

By contributing to AcademicQuest Fresh, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AcademicQuest Fresh!** 🎉

*Together, we can make academic planning more engaging and productive for students everywhere.*
