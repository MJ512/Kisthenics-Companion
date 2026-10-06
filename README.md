<p align="center">



<div align="center">
<h1>Kisthenics Companion</h1>
<br />
<a href="https://github.com/MJ512/Kisthenics-Companion/releases/download/beta/Kisthenics.Desktop.Companion_1.0.0_aarch64.1.dmg"><img src="https://iili.io/nlLKDuV.png" width="250px"></a>
<a href="https://github.com/MJ512/Kisthenics-Companion/releases/download/beta/kisthenics-companion.exe"><img src="https://iili.io/nlLKZyQ.png" width="250px"></a>
</div>

<div align="center">
<img src="https://iili.io/nlLoKQV.png">
         
    
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2](https://img.shields.io/badge/Tauri-v2-24C8DB.svg?logo=tauri)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-v19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-1.78+-DEA584.svg?logo=rust)](https://www.rust-lang.org)
</div>

</p>
<br />
**Kisthenics Companion** is an open-source, local-first desktop reminder application that pairs your daily schedule with expressive animated character personalities.

Instead of generic notification toasts, Kisthenics Companion introduces a dedicated, transparent desktop alert window featuring emotional character artwork and frosted speech bubbles that slide seamlessly into view.

---

## Features

- **Expressive Companion Alerts**: 12 emotional character personalities with custom voice tones, animations, and motivational catchphrases.
- **Intelligent Keyword Matching**: Reminder text automatically matches the best emotional character (e.g., workouts match *Kadinama Irunga*, meetings match *Shocked*, breaks match *Sleepy*).
- **Frameless Transparent Window**: Alert window floats cleanly on your desktop without window chrome or rectangular gray backdrops.
- **Sleep-Until-Due Rust Scheduler**: Battery-friendly background engine that sleeps until the exact due timestamp with sleep/wake and clock drift protection.
- **Flexible Recurrence**: One-time, daily, weekly, and weekday-only recurring reminder schedules.
- **Snooze Engine**: Quick snooze presets (`5m`, `10m`, `15m`, `30m`, `1h`, `Tomorrow 9 AM`) and celebratory particle feedback upon completion.
- **12-Hour AM/PM Time Format**: Native-feeling time selector (`[ 08 ] : [ 30 ] [ PM ]`) at the UI boundary, stored as clean 24-hour machine time internally.
- **System Tray Integration**: Operates continuously in the background tray with instant menu access to quick reminders, today's tasks, settings, and exit.
- **Dedicated Settings Page**: Clean, uncluttered preferences view for theme, reminder defaults, system autostart, and reduced motion.
- **100% Local-First & Private**: Reminders and preferences are persisted locally in SQLite (`rusqlite`). No cloud sync, no accounts, and zero telemetry.

---

## Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Dashboard UI, reminder forms, alert popup, settings |
| **Desktop Shell** | Tauri 2 | Native windowing, IPC bridge, system tray, autostart |
| **Backend Core** | Rust (`src-tauri/src/lib.rs`) | Authoritative scheduler, multi-window positioning, SQLite queries |
| **Database** | SQLite (`rusqlite`) | Local persistence, migration system (`PRAGMA user_version`) |
| **Audio** | Web Audio API | Zero-latency algorithmic synthesizer chimes |
| **Animation** | CSS Keyframes & Spring Curves | Character entrance bounces, breathing motion, speech bubbles |

---

## Architecture Overview

```
React 19 Frontend (Dashboard, Form, Popup, Settings)
         │
         ▼  (Tauri 2 IPC Boundary)
Rust Native Core (Scheduler, Multi-Window Manager, System Tray)
         │
         ▼  (Direct In-Process Calls)
SQLite Database (kisthenics_reminders.db)
```

- **Frontend** handles view routing (`dashboard` vs `settings`), 12-hour form inputs, audio cue triggers, and presentation.
- **Rust Backend** executes the authoritative background scheduler thread, calculates next due wake-ups via `Condvar`, handles multi-monitor DPI scaling for popup positioning, and manages the Windows registry / macOS login items for autostart.

Detailed architectural specifications and data flow diagrams are available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Reminder Engine

- **Authoritative Scheduling**: The Rust scheduler queries the SQLite database for pending reminders where `trigger_timestamp <= now` or `snooze_until <= now`.
- **Clock Jump & Sleep/Wake Recovery**: Sleeps adaptively between `500ms` and `10,000ms`. When a laptop resumes from prolonged sleep, the scheduler automatically awakens within milliseconds.
- **Startup Recovery**: Any alerts active during unexpected shutdowns are reset to `pending` on startup to ensure no reminder is ever lost.

Detailed engine mechanics are documented in [docs/REMINDER_ENGINE.md](docs/REMINDER_ENGINE.md).

---

## Character System

The application registers 12 character emotional profiles:

| Character | Emotion Profile | Primary Focus |
| :--- | :--- | :--- |
| **Kadinama Irunga** | Determined / Grit | Calisthenics, workouts, physical discipline |
| **Shocked** | High Alert / Urgency | Imminent meetings, urgent deadlines |
| **Sleepy** | Gentle / Resting | Hydration, posture checks, breaks, sleep |
| **Angry** | Anti-Procrastination | Overdue items, overdue tasks, critical warnings |
| **Loving** | Warm Appreciation | Family calls, birthdays, anniversaries |
| **Curious** | Thoughtful Check-in | Code reviews, document inspections, audits |
| **Silent** | Deep Focus | Flow state, reading, meditation blocks |
| **Laughing** | Playful Energy | Lighthearted daily check-ins |
| **Cool** | Relaxed Confidence | Smooth task pacing |
| **Cool Approval** | Positive Reinforcement | Project milestones, shipping features |
| **Thumbs Up** | Friendly Partnership | General everyday tasks |
| **Crying** | Urgent Pleading | High-stakes tasks needing immediate action |

See [ASSETS.md](ASSETS.md) for character artwork details and license boundaries.

---

## Time Handling

- **Presentation Boundary**: All reminder inputs and dashboard cards use standard **12-hour format with AM/PM** (e.g. `08:30 PM`, `09:05 AM`).
- **Storage Boundary**: SQLite and Rust scheduler store standard **24-hour format** (e.g. `20:30`, `09:05`) along with Unix epoch timestamps.
- **Safe Fallbacks**: Missing or malformed values safely display an em-dash (`—`) and never trigger React runtime crashes.

See [docs/TIME_FORMAT.md](docs/TIME_FORMAT.md) for the conversion reference table.

---

## Local Data & Privacy

- **Zero Cloud Storage**: All records live in `%APPDATA%\kisthenics_reminders.db` on Windows or `~/Library/Application Support/kisthenics_reminders.db` on macOS.
- **Zero Telemetry**: No tracking beacons, analytics SDKs, or remote pings.
- **Offline First**: Runs completely without internet connectivity.

---

## Platform Support

### Windows
- **Supported Versions**: Windows 10 & 11 (x64).
- **Installers**: Standard NSIS executable setup (`.exe`) and WiX Windows Installer package (`.msi`).
- **Security Integrity**: Designed for standard Authenticode code signing; never requires disabling Windows Defender, SmartScreen, or Smart App Control.
- See [docs/WINDOWS.md](docs/WINDOWS.md).

### macOS
- **Supported Versions**: macOS 12 Monterey, macOS 13 Ventura, macOS 14 Sonoma, macOS 15 Sequoia.
- **Architecture**: Apple Silicon (`aarch64`) and Intel (`x86_64`).
- **Distribution**: Packaged as signed and notarized `.dmg` / `.app` bundles via GitHub Actions CI.
- See [docs/MACOS.md](docs/MACOS.md).

---

## Installation

Download the latest installer for your operating system from the [GitHub Releases](https://github.com/MJ512/Kisthenics-Companion/releases) page.

---

## Development Setup

### Prerequisites
- Node.js 18+ & npm
- Rust toolchain (`rustc`, `cargo`)
- Visual Studio C++ Build Tools (Windows) or Xcode Command Line Tools (macOS)

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/MJ512/Kisthenics-Companion.git
cd Kisthenics-Companion

# Install dependencies
npm install

# Run web-only UI preview
npm run dev

# Run full desktop application
cargo tauri dev
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed step-by-step instructions.

---

## Build Commands

```bash
# Typecheck and build frontend
npm run build

# Verify Rust code compilation
cargo check --manifest-path src-tauri/Cargo.toml

# Build native debug bundles
cargo tauri build --debug

# Build production release installers
cargo tauri build
```

---

## Project Structure

```
├── .github/workflows/      # Automated CI & Release pipelines
├── docs/                   # Deep-dive architecture & platform documentation
├── public/                 # Favicon and character artwork
├── src/                    # React 19 frontend
│   ├── components/         # Dashboard, Popup, TimePicker, Settings
│   ├── services/           # Storage service (Tauri IPC + fallback)
│   ├── types/              # TypeScript definitions
│   └── utils/              # Time conversions, audio synth, character catalog
├── src-tauri/              # Rust desktop core
│   ├── src/lib.rs          # Scheduler, SQLite, Tray, Window management
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri 2 configuration
├── ASSETS.md               # Asset license notice
├── CHANGELOG.md            # Release version history
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
└── SECURITY.md             # Responsible disclosure policy
```

---

## Testing & Quality Assurance

- **Frontend Validation**: `npm run build` runs `tsc` and Vite production bundling.
- **Rust Compiler Check**: `cargo check --manifest-path src-tauri/Cargo.toml` enforces strict Rust borrow-checker and syntax compliance.
- **Automated CI**: GitHub Actions (`.github/workflows/ci.yml`) validates pull requests on both Ubuntu and Windows runners.

---

## Release Process & Code Signing

Release artifacts are tagged using Semantic Versioning (`v1.0.0`) and packaged automatically via GitHub Actions:
- **Windows**: Built with `makensis` and WiX, signed with Authenticode certificate.
- **macOS**: Built with Apple Clang and `create-dmg`, signed and notarized via Apple Developer ID.

See [docs/RELEASE.md](docs/RELEASE.md) for the complete checklist.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

---

## Security

To report a vulnerability, please review our [Security Policy](SECURITY.md) and submit a private report via GitHub.

---

## Roadmap

- [ ] Custom sound effect importing (`.wav`, `.mp3`)
- [ ] User custom character asset pack directory
- [ ] Multi-language localization (i18n)
- [ ] Calendar protocol URL handlers (`webcal://`)

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
Character illustrations and audio synthesis follow the terms outlined in [ASSETS.md](ASSETS.md).
