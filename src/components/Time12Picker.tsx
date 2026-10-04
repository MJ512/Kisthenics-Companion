import React from 'react';
import { parse24To12, format12To24 } from '../utils/dateTime';

interface Time12PickerProps {
  value: string; // 24-hour internal machine string, e.g. "20:30", "09:05"
  onChange: (value24: string) => void;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const Time12Picker: React.FC<Time12PickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { hour, minute, period } = parse24To12(value);

  const handleHourChange = (newHour: string) => {
    const val24 = format12To24(newHour, minute, period);
    onChange(val24);
  };

  const handleMinuteChange = (newMinute: string) => {
    const val24 = format12To24(hour, newMinute, period);
    onChange(val24);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    if (newPeriod === period) return;
    const val24 = format12To24(hour, minute, newPeriod);
    onChange(val24);
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'center',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    minWidth: 48,
  };

  return (
    <div
      className="inline-flex items-center gap-1.5 p-1 rounded-xl"
      style={{
        background: 'var(--color-surface-soft)',
        border: '1px solid var(--color-border)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Hour Select [ 08 ] */}
      <div className="relative">
        <select
          value={hour}
          disabled={disabled}
          onChange={(e) => handleHourChange(e.target.value)}
          aria-label="Hour (12-hour format)"
          style={selectStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-soft)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      {/* Colon Separator */}
      <span
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          userSelect: 'none',
          padding: '0 1px',
        }}
      >
        :
      </span>

      {/* Minute Select [ 30 ] */}
      <div className="relative">
        <select
          value={minute}
          disabled={disabled}
          onChange={(e) => handleMinuteChange(e.target.value)}
          aria-label="Minute"
          style={selectStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-soft)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* AM / PM Segmented Toggle [ PM ] */}
      <div
        className="inline-flex rounded-lg p-0.5 ml-1"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        role="group"
        aria-label="AM / PM Selector"
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePeriodChange('AM')}
          style={{
            padding: '5px 9px',
            borderRadius: 6,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: period === 'AM' ? 'var(--color-primary)' : 'transparent',
            color: period === 'AM' ? '#FFFFFF' : 'var(--color-text-tertiary)',
            transition: 'background 120ms ease, color 120ms ease',
          }}
        >
          AM
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePeriodChange('PM')}
          style={{
            padding: '5px 9px',
            borderRadius: 6,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: period === 'PM' ? 'var(--color-primary)' : 'transparent',
            color: period === 'PM' ? '#FFFFFF' : 'var(--color-text-tertiary)',
            transition: 'background 120ms ease, color 120ms ease',
          }}
        >
          PM
        </button>
      </div>
    </div>
  );
};
