/**
 * Unified Date and Time utilities for Kisthenics Desktop Companion.
 * Enforces centralized 12-hour format (hh:mm AM/PM) for all user-facing time displays
 * while preserving internal machine-readable ISO/HH:mm storage and Rust scheduler logic.
 */

export interface Time12Parts {
  hour: string;   // '01' to '12'
  minute: string; // '00' to '59'
  period: 'AM' | 'PM';
}

/**
 * Converts internal 24-hour "HH:mm" machine string to 12-hour parts.
 * Handles edge cases: midnight ("00:30" -> 12:30 AM), noon ("12:00" -> 12:00 PM).
 */
export function parse24To12(time24?: string | null): Time12Parts {
  if (!time24 || typeof time24 !== 'string') {
    return { hour: '12', minute: '00', period: 'PM' };
  }
  const parts = time24.trim().split(':');
  if (parts.length < 2) {
    return { hour: '12', minute: '00', period: 'PM' };
  }
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || h < 0 || h > 23) h = 12;
  if (isNaN(m) || m < 0 || m > 59) m = 0;

  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  return {
    hour: String(h12).padStart(2, '0'),
    minute: String(m).padStart(2, '0'),
    period,
  };
}

/**
 * Converts 12-hour parts back to internal 24-hour "HH:mm" machine string.
 * { hour: '08', minute: '30', period: 'PM' } -> "20:30"
 * { hour: '09', minute: '05', period: 'AM' } -> "09:05"
 * { hour: '12', minute: '30', period: 'AM' } -> "00:30"
 * { hour: '12', minute: '00', period: 'PM' } -> "12:00"
 */
export function format12To24(
  hour: string | number,
  minute: string | number,
  period: 'AM' | 'PM'
): string {
  let h = typeof hour === 'string' ? parseInt(hour, 10) : hour;
  let m = typeof minute === 'string' ? parseInt(minute, 10) : minute;
  if (isNaN(h) || h < 1 || h > 12) h = 12;
  if (isNaN(m) || m < 0 || m > 59) m = 0;

  let h24 = h;
  if (period === 'AM') {
    if (h === 12) h24 = 0;
  } else {
    if (h !== 12) h24 = h + 12;
  }

  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Validates whether a time string is a valid machine 24-hour time "HH:mm" (00:00 to 23:59).
 */
export function isValidTime24(time24?: string | null): boolean {
  if (!time24 || typeof time24 !== 'string') return false;
  const parts = time24.trim().split(':');
  if (parts.length !== 2) return false;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return false;
  return h >= 0 && h <= 23 && m >= 0 && m <= 59 && parts[0].length <= 2 && parts[1].length === 2;
}

/**
 * Validates whether a 12-hour component is between 1 and 12.
 */
export function isValidHour12(h: string | number): boolean {
  const num = typeof h === 'string' ? parseInt(h, 10) : h;
  return Number.isInteger(num) && num >= 1 && num <= 12;
}

/**
 * Validates whether a minute component is between 0 and 59.
 */
export function isValidMinute(m: string | number): boolean {
  const num = typeof m === 'string' ? parseInt(m, 10) : m;
  return Number.isInteger(num) && num >= 0 && num <= 59;
}

/**
 * Parses free-form natural time input into structured 12-hour parts and 24-hour time string.
 * Supports:
 * - "5:30 PM", "5:30pm", "05:30 PM", "5:30p"
 * - "530pm", "0530 PM", "1145am"
 * - "5 PM", "5pm", "12 AM"
 * - "17:30", "08:05", "00:00"
 */
export function parseNaturalTime(
  raw?: string | null
): { hour: string; minute: string; period: 'AM' | 'PM'; time24: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Case 1: Standard 24h format "HH:mm" (e.g. "17:30", "08:05", "00:00")
  if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    const parts = parse24To12(trimmed);
    const time24 = format12To24(parts.hour, parts.minute, parts.period);
    return { ...parts, time24 };
  }

  // Case 2: 12h format with colon "H:mm AM/PM" or "HH:mmAM"
  const m12WithColon = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([aApP][mM]?)?$/i);
  if (m12WithColon) {
    const h = parseInt(m12WithColon[1], 10);
    const m = parseInt(m12WithColon[2], 10);
    const pStr = m12WithColon[3];
    if (m >= 0 && m <= 59) {
      if (pStr) {
        const period: 'AM' | 'PM' = pStr.toUpperCase().startsWith('A') ? 'AM' : 'PM';
        if (h >= 1 && h <= 12) {
          const hour = String(h).padStart(2, '0');
          const minute = String(m).padStart(2, '0');
          return { hour, minute, period, time24: format12To24(hour, minute, period) };
        }
      } else {
        // No AM/PM specified: if h <= 23, treat as 24-hour time
        if (h >= 0 && h <= 23) {
          const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const parts = parse24To12(time24);
          return { ...parts, time24 };
        }
      }
    }
  }

  // Case 3: Compact digits with AM/PM (e.g. "530pm", "0530 PM", "1145am")
  const mCompact = trimmed.match(/^(\d{3,4})\s*([aApP][mM]?)?$/i);
  if (mCompact) {
    const digits = mCompact[1];
    const h = digits.length === 3 ? parseInt(digits.slice(0, 1), 10) : parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(-2), 10);
    const pStr = mCompact[2];
    if (m >= 0 && m <= 59) {
      if (pStr) {
        const period: 'AM' | 'PM' = pStr.toUpperCase().startsWith('A') ? 'AM' : 'PM';
        if (h >= 1 && h <= 12) {
          const hour = String(h).padStart(2, '0');
          const minute = String(m).padStart(2, '0');
          return { hour, minute, period, time24: format12To24(hour, minute, period) };
        }
      } else if (h >= 0 && h <= 23) {
        const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const parts = parse24To12(time24);
        return { ...parts, time24 };
      }
    }
  }

  // Case 4: Hour only with AM/PM (e.g. "5pm", "5 PM", "12 AM")
  const mHourOnly = trimmed.match(/^(\d{1,2})\s*([aApP][mM]?)$/i);
  if (mHourOnly) {
    const h = parseInt(mHourOnly[1], 10);
    const pStr = mHourOnly[2];
    const period: 'AM' | 'PM' = pStr.toUpperCase().startsWith('A') ? 'AM' : 'PM';
    if (h >= 1 && h <= 12) {
      const hour = String(h).padStart(2, '0');
      const minute = '00';
      return { hour, minute, period, time24: format12To24(hour, minute, period) };
    }
  }

  return null;
}

/**
 * Formats a time value into a clean 12-hour display string with AM/PM (e.g., "08:30 PM", "09:05 AM").
 * Handles:
 * - "HH:mm" strings (e.g. "20:30" -> "08:30 PM", "09:05" -> "09:05 AM")
 * - Unix timestamp numbers (e.g. 1791036317005 -> "07:36 PM")
 * - Date instances
 * - Full ISO datetime strings
 * - Safe fallback to "—" on null, empty, or invalid values without throwing RangeError
 */
export function formatTime(value?: string | Date | number | null): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '—';

    // Standard "HH:mm" or "HH:mm:ss" machine time string
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const parts = parse24To12(trimmed);
      return `${parts.hour}:${parts.minute} ${parts.period}`;
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return '—';
    const h = d.getHours();
    const m = d.getMinutes();
    const parts = parse24To12(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    return `${parts.hour}:${parts.minute} ${parts.period}`;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '—';
    const h = value.getHours();
    const m = value.getMinutes();
    const parts = parse24To12(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    return `${parts.hour}:${parts.minute} ${parts.period}`;
  }

  if (typeof value === 'number') {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const h = d.getHours();
    const m = d.getMinutes();
    const parts = parse24To12(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    return `${parts.hour}:${parts.minute} ${parts.period}`;
  }

  return '—';
}

/**
 * Formats a YYYY-MM-DD date string into a friendly relative label:
 * "Today", "Tomorrow", "Yesterday", or "MMM d" (e.g. "Oct 3").
 * Safe against invalid or malformed strings.
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
