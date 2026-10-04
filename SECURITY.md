# Security Policy

## 1. Supported Versions

Security updates are actively applied to the latest release of **Kisthenics Desktop Companion**:

| Version | Supported |
| :--- | :--- |
| `1.0.x` | ✅ Yes |
| `< 1.0.0` | ❌ No |

---

## 2. Reporting a Vulnerability

We take the security of our users seriously. If you discover a security vulnerability, please report it responsibly rather than opening a public issue.

### How to Report
Please report security vulnerabilities through **GitHub Private Vulnerability Reporting**:
1. Navigate to the repository's [Security tab](https://github.com/MJ512/Kisthenics-Companion/security).
2. Click **Report a vulnerability** to open an advisory draft.
3. Include details of the vulnerability, affected components, steps to reproduce, and potential impact.

### Our Commitment
- We will acknowledge receipt of your report within 48 hours.
- We will investigate and provide regular status updates.
- Once resolved, a patch will be released with appropriate public credit to the reporter.

---

## 3. Security Architecture Highlights

- **Local-First & Zero Telemetry**: All reminders, notes, and preferences are stored strictly on your local machine in SQLite (`kisthenics_reminders.db`). No user data is transmitted over the internet.
- **Tauri 2 Isolation**: The frontend runs inside a sandboxed WebView with minimal IPC capabilities declared in `src-tauri/capabilities/default.json`.
- **No Third-Party Analytics**: Zero external tracking scripts or analytics libraries are bundled into the application.
