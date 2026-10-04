# Development Guide

This guide covers setting up your local environment, building the application, and contributing code to **Kisthenics Desktop Companion**.

---

## 1. Prerequisites

### Required Tools
- **Node.js**: v18.0+ (v20+ recommended)
- **npm**: v9.0+
- **Rust**: v1.78+ (`rustc`, `cargo`)
- **Tauri CLI**: Installed via Cargo or executed via `npx @tauri-apps/cli`
  ```bash
  cargo install tauri-cli --version "^2.0.0"
  ```

---

## 2. Platform-Specific Setup

### Windows
- **C++ Build Tools**: Install Microsoft C++ Build Tools (via Visual Studio Installer with the "Desktop development with C++" workload).
- **WebView2**: Windows 10/11 includes WebView2 Runtime by default. If missing, download the Evergreen Bootstrapper from Microsoft.
- **PowerShell**: PowerShell 5.1 or PowerShell 7+.

### macOS
- **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```
- No additional webview installation is required; Tauri utilizes native WebKit on macOS.

---

## 3. Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/MJ512/Kisthenics-Companion.git
cd Kisthenics-Companion
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Verify Rust Environment
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 4. Development Workflow

### Web-Only Preview (Fast UI Iteration)
Runs Vite dev server with in-browser LocalStorage fallback:
```bash
npm run dev
```

### Native Desktop Application (Tauri Dev Mode)
Launches the full desktop application with system tray, native SQLite, and transparent popup window:
```bash
cargo tauri dev
```

---

## 5. Verification & Testing

Always verify before committing changes:

```bash
# TypeScript compilation & Vite bundle test
npm run build

# Rust backend compiler check
cargo check --manifest-path src-tauri/Cargo.toml

# Test debug packaging (without code signing)
cargo tauri build --debug
```

---

## 6. Project Layout

```
├── public/                 # Static assets & character PNGs
│   ├── images/             # Raw character artwork
│   └── characters-trimmed/ # Trimmed character artwork for UI rendering
├── src/                    # Frontend React source code
│   ├── components/         # UI components (MainDashboard, Popup, Settings, etc.)
│   ├── services/           # Storage service (Tauri IPC + fallback)
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Time, audio, and character inference helpers
│   ├── App.tsx             # Root view router
│   └── main.tsx            # React root mount
├── src-tauri/              # Rust desktop core
│   ├── src/
│   │   ├── lib.rs          # Scheduler, SQLite, Tray, IPC commands
│   │   └── main.rs         # Binary entrypoint
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri 2 configuration
│   └── capabilities/       # Tauri permissions & security policies
└── docs/                   # Technical documentation
```
