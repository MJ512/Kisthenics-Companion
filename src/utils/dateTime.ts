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
