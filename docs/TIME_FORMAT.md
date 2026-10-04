# Time Format & Conversion Architecture

Kisthenics Desktop Companion implements a strict separation of concerns between user-facing time presentation and internal machine time storage.

---

## 1. Architectural Boundary

```
User Input Form (12-Hour)
[ 08 ] : [ 30 ] [ PM ]
          │
          ▼  (UI Conversion Boundary: format12To24)
Internal String (24-Hour)
"20:30"
          │
          ▼  (IPC Payload)
SQLite Database (`time` column)
"20:30" + triggerTimestamp (Unix ms)
          │
          ▼  (Rust Native Scheduler)
Exact Schedule Comparison
          │
          ▼  (IPC Event emit: reminder-due)
Desktop Popup / Dashboard Presentation
          │
          ▼  (UI Conversion Boundary: formatTime / parse24To12)
"08:30 PM"
```

---

## 2. Canonical Conversion Examples

| User Input (12-Hour) | Internal Representation (24-Hour) | Notes |
| :--- | :--- | :--- |
| `09:05 AM` | `09:05` | Morning format with zero-padded minutes |
| `12:00 PM` | `12:00` | Standard noon representation |
| `12:30 PM` | `12:30` | Afternoon standard |
| `03:45 PM` | `15:45` | Standard PM offset (+12) |
| `08:30 PM` | `20:30` | Evening offset |
| `12:30 AM` | `00:30` | Midnight calculation (hour 12 AM -> 00) |

---

## 3. UI Boundary Helpers (`src/utils/dateTime.ts`)

- **`parse24To12(time24: string): Time12Parts`**
  Deconstructs `HH:mm` into `{ hour: '01'..'12', minute: '00'..'59', period: 'AM'|'PM' }`.
- **`format12To24(hour, minute, period): string`**
  Constructs a standard zero-padded `HH:mm` string.
- **`formatTime(value?: string | Date | number | null): string`**
  Universal presentation formatter for dashboard cards and popup headers. Formats strings (`"20:30"` -> `"08:30 PM"`), numeric timestamps, and Date instances.
  - Returns safe fallback string (`—`) on null, undefined, or empty values.
  - Never throws a `RangeError` or crashes React rendering.
