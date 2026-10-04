import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, CompanionSettings } from '../types';
import { resolveCharacter } from '../utils/characterRegistry';
import { formatTime } from '../utils/dateTime';
import { playCompanionSound } from '../utils/audio';
import { Check, Clock, X, ChevronDown, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DesktopReminderPopupProps {
  reminders: Reminder[];
  settings: CompanionSettings;
  onDone: (reminderId: string) => void;
  onSnooze: (reminderId: string, minutes: number) => void;
  onDismiss: (reminderId: string) => void;
  isStandaloneWindow?: boolean;
}

export const DesktopReminderPopup: React.FC<DesktopReminderPopupProps> = ({
  reminders,
  settings,
  onDone,
  onSnooze,
  onDismiss,
  isStandaloneWindow = false,
}) => {
  const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // Show up to 2 stacked
  const visibleReminders = reminders.slice(0, 2);
  const overflowCount = Math.max(0, reminders.length - 2);
  const topReminder = visibleReminders[0];

  // Play sound on new top reminder
  useEffect(() => {
    if (topReminder && settings.notifications.soundEnabled) {
      const char = resolveCharacter(topReminder);
      const soundType = (topReminder.soundType as any) || char.soundType || 'chime';
      playCompanionSound(soundType, settings.notifications.soundVolume);
    }
  }, [topReminder?.id, settings.notifications.soundEnabled]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!topReminder) return;
    const duration = topReminder.durationSeconds || settings.notifications.autoDismissSeconds;
    if (duration && duration > 0) {
      const timer = setTimeout(() => handleDismissClick(topReminder.id), duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [topReminder?.id, topReminder?.durationSeconds, settings.notifications.autoDismissSeconds]);

  // Calculate tomorrow 9 AM snooze offset (unconditional hook)
  const tomorrow9AMMinutes = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(9, 0, 0, 0);
    return Math.max(1, Math.round((t.getTime() - Date.now()) / 60000));
  }, []);

  if (visibleReminders.length === 0) return null;

  // Emotion-specific character entrance
  const getCharAnim = (charId: string) => {
    if (settings.accessibility.reducedMotion) return '';
    const map: Record<string, string> = {
      laugh:           'anim-char-laugh-bounce',
      cool:            'anim-char-cool-glide',
      kadinama_irunga: 'anim-char-determined-up',
      shock:           'anim-char-shock-pop',
      angry:           'anim-char-angry-shake',
      sleepy:          'anim-char-sleepy-drift',
      thumbsup:        'anim-char-thumbs-bounce',
      thumbsup_cool:   'anim-char-cool-approval',
      heart_eye:       'anim-char-love-float',
      cry:             'anim-char-cry-slow',
      question:        'anim-char-curious-tilt',
      silence:         'anim-char-silent-fade',
    };
    return map[charId] || 'anim-char-thumbs-bounce';
  };

  const snoozeOptions = [
    { label: '5 min',         minutes: 5 },
    { label: '10 min',        minutes: 10 },
    { label: '15 min',        minutes: 15 },
    { label: '30 min',        minutes: 30 },
    { label: '1 hour',        minutes: 60 },
    { label: 'Tomorrow 9 AM', minutes: tomorrow9AMMinutes },
  ];

  const handleDoneClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      confetti({
        particleCount: 32,
        spread: 55,
        origin: { x: 0.87, y: 0.80 },
        colors: ['#C15F3C', '#3F8F68', '#C58A35', '#FFFFFF'],
        scalar: 0.85,
      });
    } catch { /* ignore */ }
    setDismissingId(id);
    setTimeout(() => { onDone(id); setDismissingId(null); }, 260);
  };

  const handleSnoozeClick = (id: string, minutes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSnoozeId(null);
    setDismissingId(id);
    setTimeout(() => { onSnooze(id, minutes); setDismissingId(null); }, 260);
  };

  const handleDismissClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissingId(id);
    setTimeout(() => { onDismiss(id); setDismissingId(null); }, 260);
  };

  return (
    <div
      className={`fixed z-50 flex flex-col items-end pointer-events-none select-none ${
        isStandaloneWindow ? 'inset-0 justify-end p-3' : 'bottom-4 right-4 max-w-[420px]'
      }`}
      style={
        isStandaloneWindow
          ? { margin: 0 }
          : {
              marginRight: `${settings.notifications.marginRight || 24}px`,
              marginBottom: `${settings.notifications.marginBottom || 24}px`,
            }
      }
    >
      {/* Overflow badge */}
      {overflowCount > 0 && (
        <div
          className="mb-2 mr-2 flex items-center gap-1.5 pointer-events-auto"
          style={{
            padding: '4px 10px',
            borderRadius: 9999,
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-warning)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          <Layers size={11} />
          <span>+{overflowCount} more in queue</span>
        </div>
      )}

      {/* Stacked reminder units — newest on top */}
      <div className="flex flex-col-reverse items-end gap-3 w-full max-w-[390px]">
        {visibleReminders.map((rem, index) => {
          const char = resolveCharacter(rem);
          const isTop = index === 0;
          const isDismissing = dismissingId === rem.id;

          return (
            <div
              key={rem.id}
              className={`flex flex-col items-end w-full transition-all duration-280 ${
                isDismissing
                  ? 'anim-popup-exit pointer-events-none'
                  : isTop
                  ? 'anim-bubble-spring'
                  : 'opacity-90'
              }`}
              style={!isTop ? { transform: 'scale(0.975)', transformOrigin: 'bottom right' } : undefined}
            >
              {/* ── SPEECH BUBBLE ── */}
              <div
                className="relative w-full pointer-events-auto"
                style={{
                  background: 'var(--bubble-bg)',
                  border: '1px solid var(--bubble-border)',
                  borderRadius: '22px',
                  boxShadow: 'var(--bubble-shadow)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                }}
              >
                <div style={{ padding: '16px 16px 14px' }}>
                  {/* Header row */}
                  <div
                    className="flex items-center justify-between mb-2"
                    style={{ gap: 8 }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Character badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'var(--color-primary-soft)',
                          color: 'var(--color-primary)',
                          letterSpacing: '0.01em',
                          flexShrink: 0,
                        }}
                      >
                        {char.emotion}
                      </span>
                      {rem.category && (
                        <span
                          className="truncate"
                          style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}
                        >
                          {rem.category}
                        </span>
                      )}
                    </div>

                    {/* Dismiss X */}
                    <button
                      onClick={(e) => handleDismissClick(rem.id, e)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text-tertiary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 120ms ease, color 120ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-soft)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
                      }}
                      title="Dismiss"
                      aria-label="Dismiss reminder"
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Catchphrase */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--color-primary)',
                      marginBottom: '6px',
                      fontStyle: 'italic',
                      opacity: 0.85,
                    }}
                  >
                    {char.catchphrase}
                  </div>

                  {/* Content */}
                  <div className="bubble-scroll overflow-y-auto" style={{ maxHeight: 100, marginBottom: 10 }}>
                    <h4
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.3,
                        letterSpacing: '-0.01em',
                        wordBreak: 'break-word',
                        margin: 0,
                      }}
                    >
                      {rem.title}
                    </h4>
                    {rem.message && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.45,
                          marginTop: 4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {rem.message}
                      </p>
                    )}
                  </div>

                  {/* Time meta */}
                  <div
                    className="flex items-center gap-3"
                    style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: 10 }}
                  >
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {rem.time ? formatTime(rem.time) : 'Now'}
                    </span>
                    {rem.recurrence && rem.recurrence !== 'once' && (
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--color-surface-soft)',
                          border: '1px solid var(--color-border)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {rem.recurrence}
                      </span>
                    )}
                    {rem.snoozeCount > 0 && (
                      <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                        Snoozed {rem.snoozeCount}×
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--color-divider)', marginBottom: 10 }} />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Done */}
                    <button
                      onClick={(e) => handleDoneClick(rem.id, e)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '9px 16px',
                        borderRadius: 9999,
                        background: 'var(--color-primary)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 120ms ease, transform 80ms ease',
                        letterSpacing: '-0.005em',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)';
                      }}
                      onMouseDown={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
                      }}
                      onMouseUp={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = '';
                      }}
                      aria-label="Mark done"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      Done
                    </button>

                    {/* Snooze */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSnoozeId(activeSnoozeId === rem.id ? null : rem.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '9px 14px',
                          borderRadius: 9999,
                          background: 'var(--color-surface-soft)',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                          fontWeight: 500,
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'background 120ms ease, transform 80ms ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-soft)';
                        }}
                        onMouseDown={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
                        }}
                        onMouseUp={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = '';
                        }}
                        aria-label="Snooze"
                        aria-expanded={activeSnoozeId === rem.id}
                      >
                        <Clock size={12} />
                        Snooze
                        <ChevronDown size={11} />
                      </button>

                      {/* Snooze popover */}
                      {activeSnoozeId === rem.id && (
                        <div
                          className="absolute right-0 bottom-full mb-2 z-50"
                          style={{
                            width: 168,
                            borderRadius: 14,
                            background: 'var(--bubble-bg)',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            overflow: 'hidden',
                            padding: '4px',
                          }}
                          role="menu"
                        >
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--color-text-tertiary)',
                              padding: '6px 10px 4px',
                            }}
                          >
                            Snooze for
                          </div>
                          {snoozeOptions.map((opt) => (
                            <button
                              key={opt.label}
                              role="menuitem"
                              onClick={(e) => handleSnoozeClick(rem.id, opt.minutes, e)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '7px 10px',
                                borderRadius: 8,
                                fontSize: '13px',
                                color: 'var(--color-text-primary)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'background 100ms ease',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-soft)';
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                              }}
                            >
                              <span>{opt.label}</span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                +{opt.minutes}m
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Speech bubble tail */}
                {settings.character.showSpeechTail && (
                  <div className="speech-bubble-tail" />
                )}
              </div>

              {/* ── CHARACTER PNG ── */}
              <div
                className={`relative z-10 flex justify-end pointer-events-auto`}
                style={{
                  paddingRight: 16,
                  marginTop: -6,
                  transform: `scale(${settings.character.characterScale || 1})`,
                  transformOrigin: 'bottom right',
                }}
              >
                {/* Glow */}
                <div
                  className="absolute -top-2 right-6 w-44 h-44 rounded-full blur-3xl opacity-40 pointer-events-none"
                  style={{ background: char.glowColor }}
                />

                {/* Character */}
                <div
                  className={`relative cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 ${
                    getCharAnim(char.id)
                  } ${settings.character.enableIdleAnimation ? 'anim-idle-breathing' : ''}`}
                  onClick={(e) => handleDoneClick(rem.id, e)}
                  title={`${char.emotion} — click to mark done`}
                  style={{
                    width: 250,
                    height: 150,
                  }}
                >
                  <img
                    src={char.avatarUrl}
                    alt={char.emotion}
                    className="w-full h-full select-none"
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'bottom right',
                      filter: 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.16))',
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DesktopReminderPopup;
