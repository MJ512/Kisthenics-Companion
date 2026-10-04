import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parse24To12, format12To24, parseNaturalTime, isValidHour12, isValidMinute } from '../utils/dateTime';

export interface Time12PickerProps {
  value: string; // 24-hour internal machine string, e.g. "20:30", "09:05"
  onChange: (value24: string) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  id?: string;
  className?: string;
}

export const Time12Picker: React.FC<Time12PickerProps> = ({
  value,
  onChange,
  disabled = false,
  onValidationChange,
  id,
  className,
}) => {
  const initial = parse24To12(value);
  const [hourStr, setHourStr] = useState<string>(initial.hour);
  const [minuteStr, setMinuteStr] = useState<string>(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
  const [focusedField, setFocusedField] = useState<'hour' | 'minute' | 'period' | null>(null);

  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const periodBtnRef = useRef<HTMLButtonElement>(null);
  const lastSyncedValue = useRef<string>(value);

  // Sync state if value prop changes from outside (e.g. quick chips, reset, or loaded reminder)
  useEffect(() => {
    if (value !== lastSyncedValue.current) {
      lastSyncedValue.current = value;
      const parts = parse24To12(value);
      setHourStr(parts.hour);
      setMinuteStr(parts.minute);
      setPeriod(parts.period);
      onValidationChange?.(true);
    }
  }, [value, onValidationChange]);

  const commitIfValid = useCallback(
    (h: string, m: string, p: 'AM' | 'PM') => {
      const hNum = parseInt(h, 10);
      const mNum = parseInt(m, 10);

      const isValidH = !isNaN(hNum) && hNum >= 1 && hNum <= 12;
      const isValidM = !isNaN(mNum) && mNum >= 0 && mNum <= 59;

      if (isValidH && isValidM) {
        const val24 = format12To24(hNum, mNum, p);
        lastSyncedValue.current = val24;
        onChange(val24);
        onValidationChange?.(true);
        return true;
      } else {
        onValidationChange?.(false);
        return false;
      }
    },
    [onChange, onValidationChange]
  );

  // Check overall validity for subtle border warning if user is actively in invalid state
  const isHourInvalid = hourStr !== '' && (!isValidHour12(hourStr) || hourStr === '00' || hourStr === '0');
  const isMinuteInvalid = minuteStr !== '' && !isValidMinute(minuteStr);
  const isInvalid = isHourInvalid || isMinuteInvalid;

  // ── Keyboard / Change handlers for Hour ──
  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(hourStr, 10) || 12;
      const next = current >= 12 ? 1 : current + 1;
      const formatted = String(next).padStart(2, '0');
      setHourStr(formatted);
      commitIfValid(formatted, minuteStr, period);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(hourStr, 10) || 12;
      const next = current <= 1 ? 12 : current - 1;
      const formatted = String(next).padStart(2, '0');
      setHourStr(formatted);
      commitIfValid(formatted, minuteStr, period);
      return;
    }

    if (e.key === ':' || e.key === '/') {
      e.preventDefault();
      if (hourStr && hourStr !== '0') {
        const padded = String(parseInt(hourStr, 10) || 12).padStart(2, '0');
        setHourStr(padded);
        commitIfValid(padded, minuteStr, period);
      }
      minuteRef.current?.focus();
      minuteRef.current?.select();
      return;
    }

    if (e.key === 'ArrowRight') {
      const input = hourRef.current;
      if (input && (input.selectionStart === input.value.length || input.selectionStart === 0 && input.selectionEnd === input.value.length)) {
        minuteRef.current?.focus();
        minuteRef.current?.select();
        e.preventDefault();
      }
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value.replace(/\D/g, '');

    if (raw === '') {
      setHourStr('');
      onValidationChange?.(false);
      return;
    }

    // Reject '00'
    if (raw === '00') {
      return;
    }

    // Single digit '0' -> wait for next digit
    if (raw === '0') {
      setHourStr('0');
      onValidationChange?.(false);
      return;
    }

    // Single digit 2..9: immediately becomes '02'..'09' and auto-advances to minute
    if (raw.length === 1) {
      const digit = parseInt(raw, 10);
      if (digit >= 2 && digit <= 9) {
        const padded = `0${digit}`;
        setHourStr(padded);
        commitIfValid(padded, minuteStr, period);
        setTimeout(() => {
          minuteRef.current?.focus();
          minuteRef.current?.select();
        }, 0);
        return;
      }
      // '1' can be 1, 10, 11, 12
      setHourStr('1');
      commitIfValid('01', minuteStr, period);
      return;
    }

    // Two digits
    if (raw.length >= 2) {
      const val = parseInt(raw.slice(0, 2), 10);
      // Valid 1..12
      if (val >= 1 && val <= 12) {
        const padded = String(val).padStart(2, '0');
        setHourStr(padded);
        commitIfValid(padded, minuteStr, period);
        setTimeout(() => {
          minuteRef.current?.focus();
          minuteRef.current?.select();
        }, 0);
      } else {
        // If > 12: reject 13+ (keep prior or clamp to 12 if desired, per spec reject 13+)
        // If prior was '1' and typed e.g. '3', user likely typed 1:30. Set hour '01', minute '03'
        if (raw.startsWith('1')) {
          setHourStr('01');
          commitIfValid('01', minuteStr, period);
          const nextMinute = `0${raw[1]}`;
          setMinuteStr(nextMinute);
          commitIfValid('01', nextMinute, period);
          setTimeout(() => {
            minuteRef.current?.focus();
            minuteRef.current?.select();
          }, 0);
        }
      }
    }
  };

  const handleHourBlur = () => {
    setFocusedField(null);
    let val = parseInt(hourStr, 10);
    if (isNaN(val) || val < 1 || val > 12) {
      // Revert to existing canonical hour from value
      const fallback = parse24To12(value).hour;
      setHourStr(fallback);
      commitIfValid(fallback, minuteStr, period);
    } else {
      const formatted = String(val).padStart(2, '0');
      setHourStr(formatted);
      commitIfValid(formatted, minuteStr, period);
    }
  };

  // ── Keyboard / Change handlers for Minute ──
  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(minuteStr, 10) || 0;
      const step = e.shiftKey ? 5 : 1;
      const next = (current + step) % 60;
      const formatted = String(next).padStart(2, '0');
      setMinuteStr(formatted);
      commitIfValid(hourStr, formatted, period);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(minuteStr, 10) || 0;
      const step = e.shiftKey ? 5 : 1;
      const next = (current - step + 60) % 60;
      const formatted = String(next).padStart(2, '0');
      setMinuteStr(formatted);
      commitIfValid(hourStr, formatted, period);
      return;
    }

    if (e.key === 'Backspace') {
      const input = minuteRef.current;
      if (input && (input.value === '' || (input.selectionStart === 0 && input.selectionEnd === 0))) {
        hourRef.current?.focus();
        hourRef.current?.select();
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowLeft') {
      const input = minuteRef.current;
      if (input && (input.selectionStart === 0 || (input.selectionStart === 0 && input.selectionEnd === input.value.length))) {
        hourRef.current?.focus();
        hourRef.current?.select();
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowRight') {
      const input = minuteRef.current;
      if (input && (input.selectionStart === input.value.length || (input.selectionStart === 0 && input.selectionEnd === input.value.length))) {
        periodBtnRef.current?.focus();
        e.preventDefault();
        return;
      }
    }

    // Direct period typing from minute field (e.g. 5:30p -> sets PM)
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      const mPadded = minuteStr ? String(parseInt(minuteStr, 10) || 0).padStart(2, '0') : '00';
      setMinuteStr(mPadded);
      setPeriod('AM');
      commitIfValid(hourStr, mPadded, 'AM');
      periodBtnRef.current?.focus();
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      const mPadded = minuteStr ? String(parseInt(minuteStr, 10) || 0).padStart(2, '0') : '00';
      setMinuteStr(mPadded);
      setPeriod('PM');
      commitIfValid(hourStr, mPadded, 'PM');
      periodBtnRef.current?.focus();
      return;
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = e.target.value.replace(/\D/g, '');

    if (raw === '') {
      setMinuteStr('');
      onValidationChange?.(false);
      return;
    }

    // Single digit 6..9: minute cannot be 60+, so 6..9 becomes 06..09 and advances to Period
    if (raw.length === 1) {
      const digit = parseInt(raw, 10);
      if (digit >= 6 && digit <= 9) {
        const padded = `0${digit}`;
        setMinuteStr(padded);
        commitIfValid(hourStr, padded, period);
        setTimeout(() => {
          periodBtnRef.current?.focus();
        }, 0);
        return;
      }
      setMinuteStr(raw);
      return;
    }

    // Two digits
    if (raw.length >= 2) {
      const val = parseInt(raw.slice(0, 2), 10);
      if (val >= 0 && val <= 59) {
        const padded = String(val).padStart(2, '0');
        setMinuteStr(padded);
        commitIfValid(hourStr, padded, period);
        setTimeout(() => {
          periodBtnRef.current?.focus();
        }, 0);
      } else {
        // Reject 60+ (keep first valid digit or clamp)
        const firstDigit = parseInt(raw[0], 10);
        if (firstDigit <= 5) {
          setMinuteStr(String(firstDigit));
        }
      }
    }
  };

  const handleMinuteBlur = () => {
    setFocusedField(null);
    let val = parseInt(minuteStr, 10);
    if (isNaN(val) || val < 0 || val > 59) {
      const fallback = parse24To12(value).minute;
      setMinuteStr(fallback);
      commitIfValid(hourStr, fallback, period);
    } else {
      const formatted = String(val).padStart(2, '0');
      setMinuteStr(formatted);
      commitIfValid(hourStr, formatted, period);
    }
  };

  // ── Period Toggle Handler ──
  const togglePeriod = (target?: 'AM' | 'PM') => {
    if (disabled) return;
    const nextPeriod: 'AM' | 'PM' = target ? target : period === 'AM' ? 'PM' : 'AM';
    setPeriod(nextPeriod);
    const h = hourStr || parse24To12(value).hour;
    const m = minuteStr || parse24To12(value).minute;
    commitIfValid(h, m, nextPeriod);
  };

  const handlePeriodKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      togglePeriod();
      return;
    }

    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      togglePeriod('AM');
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePeriod('PM');
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      e.preventDefault();
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }
  };

  // ── Paste Handler (supports "5:30 PM", "530pm", "17:30", etc.) ──
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const parsed = parseNaturalTime(text);
    if (parsed) {
      e.preventDefault();
      setHourStr(parsed.hour);
      setMinuteStr(parsed.minute);
      setPeriod(parsed.period);
      lastSyncedValue.current = parsed.time24;
      onChange(parsed.time24);
      onValidationChange?.(true);
      periodBtnRef.current?.focus();
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '46px',
    height: '36px',
    padding: '0 4px',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    outline: 'none',
    textAlign: 'center',
    caretColor: 'var(--color-primary)',
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  };

  const periodButtonStyle: React.CSSProperties = {
    minWidth: '46px',
    height: '36px',
    padding: '0 8px',
    background: 'var(--color-surface)',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontFamily: 'inherit',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease, background 150ms ease',
  };

  return (
    <div
      id={id}
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl transition-all ${className || ''}`}
      style={{
        background: 'var(--color-surface-soft)',
        border: isInvalid
          ? '1px solid var(--color-error)'
          : focusedField
          ? '1px solid var(--color-primary)'
          : '1px solid var(--color-border)',
        boxShadow: isInvalid
          ? '0 0 0 2px var(--color-error-soft)'
          : focusedField
          ? '0 0 0 2px var(--color-primary-soft)'
          : 'none',
        opacity: disabled ? 0.6 : 1,
      }}
      onPaste={handlePaste}
      role="group"
      aria-label="12-hour Time Picker"
    >
      {/* ── Hour Input [ 05 ] ── */}
      <input
        ref={hourRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        placeholder="12"
        disabled={disabled}
        value={hourStr}
        onChange={handleHourChange}
        onKeyDown={handleHourKeyDown}
        onFocus={(e) => {
          setFocusedField('hour');
          e.target.select();
        }}
        onBlur={handleHourBlur}
        aria-label="Hour (1 to 12)"
        title="Type hour (1–12), use ↑/↓ to adjust"
        style={{
          ...inputStyle,
          borderColor: focusedField === 'hour' ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: focusedField === 'hour' ? '0 0 0 2px var(--color-primary-soft)' : 'none',
        }}
      />

      {/* ── Colon Separator : ── */}
      <span
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          userSelect: 'none',
          padding: '0 1px',
        }}
        aria-hidden="true"
      >
        :
      </span>

      {/* ── Minute Input [ 30 ] ── */}
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        placeholder="00"
        disabled={disabled}
        value={minuteStr}
        onChange={handleMinuteChange}
        onKeyDown={handleMinuteKeyDown}
        onFocus={(e) => {
          setFocusedField('minute');
          e.target.select();
        }}
        onBlur={handleMinuteBlur}
        aria-label="Minute (00 to 59)"
        title="Type minute (00–59), use ↑/↓ to adjust"
        style={{
          ...inputStyle,
          borderColor: focusedField === 'minute' ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: focusedField === 'minute' ? '0 0 0 2px var(--color-primary-soft)' : 'none',
        }}
      />

      {/* ── AM / PM Toggle Button [ PM ] ── */}
      <button
        ref={periodBtnRef}
        type="button"
        disabled={disabled}
        onClick={() => togglePeriod()}
        onKeyDown={handlePeriodKeyDown}
        onFocus={() => setFocusedField('period')}
        onBlur={() => setFocusedField(null)}
        aria-label={`Time period: ${period}. Click or press Space to toggle AM / PM`}
        title="Click or press Space / A / P to toggle AM/PM"
        style={{
          ...periodButtonStyle,
          borderColor: focusedField === 'period' ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: focusedField === 'period' ? '0 0 0 2px var(--color-primary-soft)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'var(--color-primary-soft)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'var(--color-surface)';
          }
        }}
      >
        {period}
      </button>
    </div>
  );
};
