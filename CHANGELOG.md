# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-04

### Added
- **Native Desktop Architecture**: Built on Tauri 2, React 19, TypeScript, and Rust.
- **Sleep-Until-Due Background Scheduler**: Rust scheduler with condition-variable notifications and clock drift / laptop sleep-wake protection.
- **Local SQLite Persistence**: Bundled SQLite database (`rusqlite`) with automatic migration versioning and database integrity checks.
- **Frameless Transparent Reminder Popup**: Dedicated secondary desktop window displaying frosted glass speech bubbles and emotional character artwork.
- **12 Expressive Character Personalities**: Full catalog of character artwork with automatic keyword matching for tasks (meetings, workouts, hydration, deadlines, focus).
- **Recurrence Engine**: Support for one-time, daily, weekly, and weekday-only recurring schedules with automatic date advancement.
- **Comprehensive Snooze System**: Quick snooze options (`5m`, `10m`, `15m`, `30m`, `1h`, `Tomorrow 9 AM`).
- **12-Hour Time Format**: Native-feeling `[ 08 ] : [ 30 ] [ PM ]` time picker at the UI boundary converting seamlessly to/from internal `HH:mm` storage.
- **Dedicated Settings Page**: Clean 4-section desktop view for Appearance (System/Light/Dark), Reminders (Duration, Snooze, Sound), Behavior (Autostart, Close to Tray), and Accessibility (Reduced Motion).
- **System Tray Integration**: Background tray menu with shortcuts for Quick New Reminder, Today's view, Settings, and Clean Exit.
- **Windows Packaging**: Production NSIS (`.exe`) and WiX MSI (`.msi`) installer support.
