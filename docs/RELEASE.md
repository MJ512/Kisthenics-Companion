# Release Management & Distribution Workflow

This guide details the release cycle, version tagging, and multi-platform packaging for **Kisthenics Desktop Companion**.

---

## 1. Release Artifacts Overview

| Platform | Target File | Toolchain | Artifact Path |
| :--- | :--- | :--- | :--- |
| **Windows** | `.exe` (NSIS Installer) | `makensis` | `src-tauri/target/release/bundle/nsis/*.exe` |
| **Windows** | `.msi` (Windows Installer) | WiX (`candle`, `light`) | `src-tauri/target/release/bundle/msi/*.msi` |
| **macOS** | `.dmg` (Disk Image) | `create-dmg` | `src-tauri/target/release/bundle/dmg/*.dmg` |
| **macOS** | `.app` (App Bundle) | Apple Clang / Cargo | `src-tauri/target/release/bundle/macos/*.app` |

---

## 2. Release Checklist

1. **Verify Working Tree**:
   ```bash
   git status
   # Ensure no untracked local state or secret files exist
   ```
2. **Synchronize Version Numbers**:
   Ensure consistent semantic versioning across:
   - `package.json` (`"version": "X.Y.Z"`)
   - `src-tauri/Cargo.toml` (`version = "X.Y.Z"`)
   - `src-tauri/tauri.conf.json` (`"version": "X.Y.Z"`)
3. **Execute Pre-flight Validations**:
   ```bash
   npm run build
   cargo check --manifest-path src-tauri/Cargo.toml
   ```
4. **Update Changelog**:
   Add notes for the upcoming version under `CHANGELOG.md`.
5. **Tag Git Release**:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
6. **Automated CI/CD**:
   The release workflow (`.github/workflows/release.yml`) builds Windows and macOS artifacts, computes checksums (`SHA256SUMS.txt`), and drafts a GitHub Release.

---

## 3. Credential Security Guardrails

> [!CAUTION]
> NEVER commit private keys, `.pfx`, `.p12`, or certificates to Git.
> All signing credentials must be injected solely through encrypted GitHub Actions Secrets.
