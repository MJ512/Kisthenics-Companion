# Contributing to Kisthenics Desktop Companion

Thank you for your interest in contributing to **Kisthenics Desktop Companion**! We welcome bug reports, feature suggestions, documentation enhancements, and pull requests.

---

## 1. Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all members of the community with respect and empathy.

---

## 2. Development Setup

Follow the instructions in our [Development Guide](docs/DEVELOPMENT.md) to set up your local development environment:
1. Fork and clone the repository.
2. Install Node dependencies (`npm install`).
3. Verify the Rust toolchain (`cargo check --manifest-path src-tauri/Cargo.toml`).
4. Run the development environment (`cargo tauri dev`).

---

## 3. Branching & Pull Requests

1. **Branch Naming**:
   - `feat/feature-name` for new features
   - `fix/bug-description` for bug fixes
   - `docs/topic` for documentation updates
2. **Quality Standards**:
   - Maintain strict TypeScript type safety.
   - Do not add heavy dependencies without compelling necessity.
   - Preserve native desktop aesthetic and responsiveness.
   - Respect user privacy: all data stays local in SQLite; never add remote telemetry or tracking.
3. **Commit Messages**:
   Use conventional commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
4. **Pre-PR Verification**:
   Ensure both frontend and backend checks pass cleanly before opening a pull request:
   ```bash
   npm run build
   cargo check --manifest-path src-tauri/Cargo.toml
   ```

---

## 4. Reporting Issues

When submitting an issue on GitHub:
- Include OS version (e.g., Windows 11 23H2, macOS Sonoma 14.5).
- Describe steps to reproduce the unexpected behavior.
- Include console or terminal logs if available.
