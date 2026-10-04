import React, { useState, useEffect } from 'react';
import { Reminder, CharacterAsset, RecurrenceType, PriorityLevel } from '../types';
import { CHARACTER_CATALOG, inferCharacterForContext } from '../utils/characterRegistry';
import { formatTime } from '../utils/dateTime';
import { Time12Picker } from './Time12Picker';
import { NOTIFICATION_SOUNDS, playCompanionSound } from '../utils/audio';
import { X, Clock, Calendar, Repeat, Check, Wand2, Volume2, Timer, Sparkles } from 'lucide-react';

interface NewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
  initialReminder?: Reminder | null;
}

function FieldLabel({
  icon: Icon,
  children,
  style,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        ...style,
      }}
    >
      {Icon && <Icon size={11} />}
      {children}
    </div>
  );
}

export const NewReminderModal: React.FC<NewReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReminder,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('17:00');
  const [characterMode, setCharacterMode] = useState<'auto' | 'manual'>('auto');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('thumbsup');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [category, setCategory] = useState('General');
  const [soundType, setSoundType] = useState<string>('kadinama-irunga');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  useEffect(() => {
    if (initialReminder) {
      setTitle(initialReminder.title);
      setMessage(initialReminder.message || '');
      setDate(initialReminder.date);
      setTime(initialReminder.time);
      if (initialReminder.characterId === 'auto') {
        setCharacterMode('auto');
      } else {
        setCharacterMode('manual');
        setSelectedCharacterId(initialReminder.characterId);
      }
      setRecurrence(initialReminder.recurrence);
      setPriority(initialReminder.priority);
      setCategory(initialReminder.category || 'General');
      setSoundType(initialReminder.soundType || 'kadinama-irunga');
      setDurationSeconds(initialReminder.durationSeconds || 0);
    } else {
      setTitle('');
      setMessage('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('17:00');
      setCharacterMode('auto');
      setSelectedCharacterId('thumbsup');
      setRecurrence('once');
      setPriority('medium');
      setCategory('General');
      setSoundType('kadinama-irunga');
      setDurationSeconds(0);
    }
  }, [initialReminder, isOpen]);

  const autoInferredCharacter = inferCharacterForContext(`${title} ${message}`);
  const effectiveCharacter: CharacterAsset =
    characterMode === 'auto'
      ? autoInferredCharacter
      : CHARACTER_CATALOG.find((c) => c.id === selectedCharacterId) || CHARACTER_CATALOG[0];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [hours, minutes] = time.split(':').map(Number);
    const triggerDate = new Date(date);
    triggerDate.setHours(hours || 0, minutes || 0, 0, 0);

    const reminder: Reminder = {
      id: initialReminder?.id || `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      message: message.trim(),
      time,
      date,
      triggerTimestamp: triggerDate.getTime(),
      characterId: characterMode === 'auto' ? 'auto' : selectedCharacterId,
      resolvedCharacterId: effectiveCharacter.id,
      recurrence,
      priority,
      status: 'pending',
      snoozeCount: initialReminder?.snoozeCount || 0,
      createdAt: initialReminder?.createdAt || Date.now(),
      category,
      soundType,
      durationSeconds: Number(durationSeconds) || 0,
    };

    onSave(reminder);
    onClose();
  };

  const quickTimes = [
    {
      label: '10 min', getTime: () => {
        const d = new Date(Date.now() + 10 * 60000);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    },
    {
      label: '30 min', getTime: () => {
        const d = new Date(Date.now() + 30 * 60000);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    },
    { label: '5:00 PM', getTime: () => '17:00' },
    { label: '7:00 PM', getTime: () => '19:00' },
    { label: '9:00 PM', getTime: () => '21:00' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 13px',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    WebkitAppearance: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A958D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="anim-modal-enter w-full modal-scroll overflow-y-auto"
        style={{
          maxWidth: 560,
          maxHeight: '92vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between sticky top-0"
          style={{
            padding: '18px 20px 16px',
            borderBottom: '1px solid var(--color-divider)',
            background: 'var(--color-surface)',
            zIndex: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {initialReminder ? 'Edit Reminder' : 'New Reminder'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
              Your companion will appear with this message.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close"
            style={{ marginLeft: 12 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>

            {/* ── Title ── */}
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>What do you need to do?</FieldLabel>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call client about website deliverables…"
                style={{ ...inputStyle, fontSize: '15px', fontWeight: 500 }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-soft)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
              />
            </div>

            {/* ── Notes ── */}
            <div style={{ marginBottom: 20 }}>
              <FieldLabel>Notes (shown in speech bubble)</FieldLabel>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Extra details for the speech bubble…"
                style={{
                  ...inputStyle,
                  resize: 'none',
                  lineHeight: 1.5,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-soft)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* ── Date / Time / Recurrence ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 1fr) auto minmax(130px, 1fr)',
                gap: 12,
                alignItems: 'start',
                marginBottom: 10,
              }}
            >
              <div>
                <FieldLabel icon={Calendar}>Date</FieldLabel>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <FieldLabel icon={Clock} style={{ marginBottom: 0 }}>Time (12-hour)</FieldLabel>
                </div>
                <Time12Picker value={time} onChange={(val24) => setTime(val24)} />
              </div>
              <div>
                <FieldLabel icon={Repeat}>Repeat</FieldLabel>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  style={selectStyle}
                >
                  <option value="once">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="weekdays">Weekdays</option>
                </select>
              </div>
            </div>

            {/* Quick time chips */}
            <div className="flex flex-wrap items-center gap-1.5" style={{ marginBottom: 20 }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500, marginRight: 2 }}>
                Quick:
              </span>
              {quickTimes.map((qt) => (
                <button
                  key={qt.label}
                  type="button"
                  onClick={() => setTime(qt.getTime())}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-soft)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'background 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-soft)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-soft)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  }}
                >
                  {qt.label}
                </button>
              ))}
            </div>

            {/* ── Sound / Duration ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div>
                <FieldLabel icon={Volume2}>Alert sound</FieldLabel>
                <select
                  value={soundType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSoundType(val);
                    playCompanionSound(val);
                  }}
                  style={selectStyle}
                >
                  <optgroup label="Notification Sounds">
                    {NOTIFICATION_SOUNDS.filter((s) => s.group === 'main').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Others">
                    {NOTIFICATION_SOUNDS.filter((s) => s.group === 'others').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <FieldLabel icon={Timer}>Duration</FieldLabel>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  style={selectStyle}
                >
                  <option value={0}>Persistent</option>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
            </div>

            {/* ── Character Selection ── */}
            <div
              style={{
                borderTop: '1px solid var(--color-divider)',
                paddingTop: 18,
                marginTop: 4,
              }}
            >
              {/* Section header */}
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
                    Character
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    Who speaks your reminder? Auto matches your text.
                  </p>
                </div>

                {/* Auto / Manual toggle */}
                <div
                  className="flex p-0.5 rounded-xl"
                  style={{
                    background: 'var(--color-surface-soft)',
                    border: '1px solid var(--color-border)',
                    gap: 2,
                  }}
                >
                  {(['auto', 'manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCharacterMode(mode)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 11px',
                        borderRadius: 9,
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 120ms ease, color 120ms ease',
                        background: characterMode === mode ? 'var(--color-primary)' : 'transparent',
                        color: characterMode === mode ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >
                      {mode === 'auto' && <Wand2 size={11} />}
                      {mode === 'auto' ? 'Auto' : 'Pick'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto mode — preview of inferred character */}
              {characterMode === 'auto' && (
                <div
                  className="flex items-center gap-3"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'var(--color-primary-soft)',
                    border: '1px solid rgba(193, 95, 60, 0.2)',
                    marginBottom: 12,
                  }}
                >
                  <img
                    src={autoInferredCharacter.avatarUrl}
                    alt={autoInferredCharacter.emotion}
                    className="object-contain select-none"
                    style={{ width: 44, height: 36 }}
                  />
                  <div>
                    <div
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}
                    >
                      {autoInferredCharacter.emotion}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: 1 }}>
                      "{autoInferredCharacter.catchphrase}"
                    </div>
                  </div>
                </div>
              )}

              {/* PNG grid — all 12 characters */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 6,
                  maxHeight: 200,
                  overflowY: 'auto',
                  paddingRight: 2,
                }}
                className="modal-scroll"
              >
                {CHARACTER_CATALOG.map((char) => {
                  const isSelected =
                    characterMode === 'manual'
                      ? selectedCharacterId === char.id
                      : autoInferredCharacter.id === char.id;

                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setCharacterMode('manual');
                        setSelectedCharacterId(char.id);
                      }}
                      className={`char-card${isSelected ? ' selected' : ''}`}
                      title={`${char.emotion} — ${char.catchphrase}`}
                      aria-pressed={isSelected}
                    >
                      <div style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img
                          src={char.avatarUrl}
                          alt={char.emotion}
                          className="max-h-full max-w-full object-contain select-none"
                          style={{ transition: 'transform 150ms ease' }}
                          draggable={false}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {char.emotion}
                      </span>
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 3,
                            right: 3,
                            width: 14,
                            height: 14,
                            borderRadius: 9999,
                            background: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={8} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 sticky bottom-0"
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-divider)',
              background: 'var(--color-surface)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '9px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!title.trim()}
              style={{ fontSize: '13px', padding: '9px 20px' }}
            >
              <Check size={13} strokeWidth={2.5} />
              {initialReminder ? 'Save Changes' : 'Schedule Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
