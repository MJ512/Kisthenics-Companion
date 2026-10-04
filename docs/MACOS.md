# macOS Architecture & Distribution Plan

This document outlines the target configuration and release pipeline for running **Kisthenics Desktop Companion** on macOS (macOS 12 Monterey, macOS 13 Ventura, macOS 14 Sonoma, macOS 15 Sequoia).

> [!NOTE]
> Windows is the primary active target currently verified locally. macOS distribution is prepared via cross-platform Tauri architecture and CI/CD automation. Pre-built macOS release artifacts will be published through automated GitHub Actions workflows.

---

## 1. Distribution Targets

Tauri supports two standard distribution packaging formats for macOS:

1. **Application Bundle (`.app`)**:
   Self-contained directory structure placed in `/Applications`.
2. **Apple Disk Image (`.dmg`)**:
   Standard drag-and-drop installer container.

---

## 2. Platform Architecture Targets

- **Apple Silicon (`aarch64-apple-darwin`)**: Native ARM64 binary for M1, M2, M3, M4 processors.
- **Intel (`x86_64-apple-darwin`)**: Native x86_64 binary for legacy Intel-based Macs.
- **Universal Binary (`universal-apple-darwin`)**: Unified fat binary combining both slices via `lipo`.

---

## 3. Native Integration Differences

### System Autostart
While Windows uses the `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` registry hive, macOS autostart is implemented via AppleScript Login Items in `src-tauri/src/lib.rs`:
```rust
#[cfg(target_os = "macos")]
{
    let script = format!(
        "tell application \"System Events\" to make login item at end with properties {{path:\"{}\", hidden:true}}",
        exe_str
    );
    let _ = std::process::Command::new("osascript").args(&["-e", &script]).output();
}
```

### Transparent Window Rendering
Tauri uses macOS `WKWebView`. The transparent reminder alert window is fully supported without window decorations or dropshadows.

---

## 4. Code Signing & Apple Notarization Pipeline

To run without Gatekeeper friction on modern macOS versions:

1. **Apple Developer Account**: Required Developer ID Application Certificate.
2. **Signing**:
   ```bash
   codesign --deep --force --options runtime --sign "Developer ID Application: Your Name (TeamID)" "Kisthenics Desktop Companion.app"
   ```
3. **Notarization**: Submit the `.dmg` or `.zip` to Apple Notary Service via `notarytool`:
   ```bash
   xcrun notarytool submit "Kisthenics.dmg" --keychain-profile "AC_PASSWORD" --wait
   xcrun stapler staple "Kisthenics.dmg"
   ```
4. **CI Integration**: Managed automatically in GitHub Actions release workflows using environment variables:
   - `APPLE_CERTIFICATE` (Base64 .p12)
   - `APPLE_CERTIFICATE_PASSWORD`
   - `APPLE_SIGNING_IDENTITY`
   - `APPLE_ID`
   - `APPLE_PASSWORD` (App-specific password)
   - `APPLE_TEAM_ID`
