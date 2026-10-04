import React, { useState } from 'react';
import { CompanionSettings } from '../types';
import { ArrowLeft, Check, Volume2 } from 'lucide-react';
import { playCompanionSound } from '../utils/audio';
import { applyTheme } from '../App';

interface SettingsPageProps {
  settings: CompanionSettings;
  onSave: (newSettings: CompanionSettings) => void;
  onBack: () => void;
}

// Toggle switch component
function Toggle({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="toggle"
      aria-label={label || id}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className="toggle-track"
        style={{
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
        }}
      />
      <div
        className="toggle-thumb"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </label>
  );
}

// Settings row container
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '14px 18px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        transition: 'background 120ms ease, border-color 120ms ease',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.005em',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              marginTop: 3,
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
        paddingLeft: 4,
        marginBottom: 8,
        marginTop: 20,
      }}
    >
      {title}
    </div>
  );
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSave,
  onBack,
}) => {
  const [current, setCurrent] = useState<CompanionSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSave(current);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const selectStyle: React.CSSProperties = {
    padding: '7px 28px 7px 12px',
    background: 'var(--color-surface-soft)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239A958D' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  };

  // Close to tray setting (defaults to true)
  const closeToTrayValue = current.general.closeToTray ?? true;

  // Snooze preset fallback
  const currentSnoozeDuration = current.notifications.defaultSnoozeMinutes ?? current.notifications.snoozePresets?.[1] ?? 10;

  return (
    <div
      className="flex flex-col flex-1 min-h-0 w-full select-none overflow-hidden"
      style={{
        background: 'var(--color-background)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* ── HEADER BAR ── */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="btn-ghost"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              gap: 6,
              borderRadius: 8,
            }}
            aria-label="Back to Reminders"
          >
            <ArrowLeft size={15} />
            <span>Reminders</span>
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />
          <h1
            style={{
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            Settings
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{
                color: 'var(--color-success)',
                background: 'rgba(63, 143, 104, 0.12)',
              }}
            >
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              gap: 6,
            }}
            aria-label="Save Settings"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>Save Changes</span>
          </button>
        </div>
      </header>

      {/* ── SCROLLABLE SETTINGS CONTENT ── */}
      <main
        className="flex-1 min-h-0 overflow-y-auto modal-scroll px-6 py-6"
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '64px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 580 }}>

          {/* ── 1. APPEARANCE ── */}
          <SectionHeader title="1. Appearance" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                padding: '14px 18px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 10,
                }}
              >
                Theme
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(
                  [
                    { id: 'system', label: 'System' },
                    { id: 'light',  label: 'Light' },
                    { id: 'dark',   label: 'Dark' },
                  ] as const
                ).map((t) => {
                  const isSelected = current.appearance.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setCurrent({
                          ...current,
                          appearance: { ...current.appearance, theme: t.id },
                        });
                        applyTheme(t.id);
                      }}
                      style={{
                        padding: '9px 0',
                        borderRadius: 9,
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        border: isSelected
                          ? '1.5px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        background: isSelected
                          ? 'var(--color-primary-soft)'
                          : 'var(--color-surface-soft)',
                        color: isSelected
                          ? 'var(--color-primary)'
                          : 'var(--color-text-secondary)',
                        transition: 'all 120ms ease',
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 2. REMINDERS ── */}
          <SectionHeader title="2. Reminders" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SettingsRow
              label="Default reminder duration"
              description="How long reminder alerts stay on screen before auto-dismissing"
            >
              <select
                value={current.notifications.autoDismissSeconds}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      autoDismissSeconds: parseInt(e.target.value, 10),
                    },
                  })
                }
                style={selectStyle}
              >
                <option value={0}>Persistent (until action)</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
              </select>
            </SettingsRow>

            <SettingsRow
              label="Snooze duration"
              description="Default minutes when clicking snooze on a reminder"
            >
              <select
                value={currentSnoozeDuration}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      defaultSnoozeMinutes: parseInt(e.target.value, 10),
                    },
                  })
                }
                style={selectStyle}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </SettingsRow>

            <SettingsRow
              label="Alert sound"
              description="Play an audible chime when reminders trigger"
            >
              <Toggle
                id="setting-sound"
                checked={current.notifications.soundEnabled}
                onChange={(v) =>
                  setCurrent({
                    ...current,
                    notifications: { ...current.notifications, soundEnabled: v },
                  })
                }
                label="Alert sound"
              />
            </SettingsRow>

            {current.notifications.soundEnabled && (
              <div
                style={{
                  padding: '12px 18px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      Alert Volume
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playCompanionSound('kadinama-irunga', current.notifications.soundVolume)}
                      className="btn-ghost"
                      style={{ padding: '2px 8px', fontSize: '11px', borderRadius: 4 }}
                    >
                      Test
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {Math.round((current.notifications.soundVolume || 0.8) * 100)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={current.notifications.soundVolume || 0.8}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      notifications: {
                        ...current.notifications,
                        soundVolume: parseFloat(e.target.value),
                      },
                    })
                  }
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>
            )}
          </div>

          {/* ── 3. BEHAVIOR ── */}
          <SectionHeader title="3. Behavior" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SettingsRow
              label="Launch at startup"
              description="Start Kisthenics automatically on Windows login"
            >
              <Toggle
                id="setting-startup"
                checked={current.general.launchAtStartup}
                onChange={(v) =>
                  setCurrent({
                    ...current,
                    general: { ...current.general, launchAtStartup: v },
                  })
                }
                label="Launch at startup"
              />
            </SettingsRow>

            <SettingsRow
              label="Close to tray"
              description="Keep companion running in the Windows taskbar tray when the window is closed"
            >
              <Toggle
                id="setting-close-tray"
                checked={closeToTrayValue}
                onChange={(v) =>
                  setCurrent({
                    ...current,
                    general: { ...current.general, closeToTray: v },
                  })
                }
                label="Close to tray"
              />
            </SettingsRow>
          </div>

          {/* ── 4. ACCESSIBILITY ── */}
          <SectionHeader title="4. Accessibility" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
            <SettingsRow
              label="Reduced motion"
              description="Minimize spring animations and dynamic character movements"
            >
              <Toggle
                id="setting-reduced-motion"
                checked={current.accessibility.reducedMotion}
                onChange={(v) =>
                  setCurrent({
                    ...current,
                    accessibility: { ...current.accessibility, reducedMotion: v },
                  })
                }
                label="Reduced motion"
              />
            </SettingsRow>
          </div>

          {/* Generous bottom breather margin */}
          <div style={{ height: 48 }} />

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
