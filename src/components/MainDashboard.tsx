import React, { useState } from 'react';
import { Reminder, CompanionSettings } from '../types';
import { resolveCharacter, CHARACTER_CATALOG } from '../utils/characterRegistry';
import { formatTime, formatDate } from '../utils/dateTime';
import {
  Plus,
  Play,
  Settings,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Edit3,
  BellRing,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface MainDashboardProps {
  reminders: Reminder[];
  settings: CompanionSettings;
  onNewReminder: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onCompleteReminder: (id: string) => void;
  onSnoozeReminder: (id: string, minutes: number) => void;
  onTestTrigger: (reminder: Reminder) => void;
  onOpenSettings: () => void;
  onOpenRoster: () => void;
}

const priorityDot: Record<string, string> = {
  urgent: 'bg-[var(--color-error)]',
  high: 'bg-[var(--color-warning)]',
  medium: 'bg-[var(--color-primary)]',
  low: 'bg-[var(--color-text-tertiary)]',
};

type TabId = 'today' | 'upcoming' | 'completed' | 'all';

export const MainDashboard: React.FC<MainDashboardProps> = ({
  reminders,
  settings,
  onNewReminder,
  onEditReminder,
  onDeleteReminder,
  onCompleteReminder,
  onSnoozeReminder,
  onTestTrigger,
  onOpenSettings,
  onOpenRoster,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredReminders = safeReminders.filter((rem) => {
    if (activeTab === 'today') return rem.status !== 'completed' && rem.date === todayStr;
    if (activeTab === 'upcoming') return rem.status !== 'completed' && rem.date >= todayStr;
    if (activeTab === 'completed') return rem.status === 'completed';
    return true;
  });

  const completedToday = safeReminders.filter((r) => {
    if (r.status !== 'completed' || !r.completedAt) return false;
    try {
      const d = new Date(r.completedAt);
      if (isNaN(d.getTime())) return false;
      return d.toISOString().split('T')[0] === todayStr;
    } catch {
      return false;
    }
  }).length;

  const pendingCount = safeReminders.filter((r) => r.status === 'pending').length;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'today', label: 'Today', count: safeReminders.filter(r => r.status !== 'completed' && r.date === todayStr).length },
    { id: 'upcoming', label: 'Upcoming', count: safeReminders.filter(r => r.status !== 'completed' && r.date >= todayStr).length },
    { id: 'completed', label: 'Completed', count: safeReminders.filter(r => r.status === 'completed').length },
    { id: 'all', label: 'All' },
  ];

  return (
    <div
      className="flex-1 min-h-0 flex flex-col select-none overflow-hidden"
      style={{ background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
    >
      {/* ── HEADER ── */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
        }}
      >
        {/* Header Identity with authentic kadinama irunga branding */}
        <div className="flex items-center gap-3">
          <img
            src="/images/characters-trimmed/kadinama%20irunga.png"
            alt="Kisthenics Companion Logo"
            className="shrink-0 cursor-pointer select-none transition-transform duration-150 hover:scale-105"
            style={{
              width: 44,
              height: 42,
              objectFit: 'contain',
              objectPosition: 'center',
            }}
            onClick={onOpenRoster}
            title="Kisthenics Companion — Click to view characters"
            draggable={false}
          />
          <div className="flex items-center gap-2">
            <span
              className="font-semibold leading-tight"
              style={{ fontSize: '15px', letterSpacing: '-0.015em', color: 'var(--color-text-primary)' }}
            >
              Kisthenics Companion
            </span>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: 'var(--color-success)',
                boxShadow: '0 0 0 2px rgba(63, 143, 104, 0.25)',
              }}
              title="Companion Active"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => safeReminders.length > 0 ? onTestTrigger(safeReminders[0]) : onNewReminder()}
            className="btn-ghost"
            style={{ fontSize: '13px', gap: '5px' }}
            title="Preview desktop alert popup"
            aria-label="Test alert"
          >
            <BellRing size={14} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={onOpenRoster}
            className="btn-ghost"
            style={{ fontSize: '13px', gap: '5px' }}
            aria-label="Characters"
          >
            <Users size={14} />
            <span className="hidden sm:inline">Characters</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-icon"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={onNewReminder}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
            aria-label="New Reminder"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Reminder</span>
          </button>
        </div>
      </header>


      {/* ── TAB BAR ── */}
      <div
        className="px-6 pt-3 pb-3 shrink-0"
        style={{ borderBottom: '1px solid var(--color-divider)' }}
      >
        <div
          className="inline-flex gap-0.5 p-1 rounded-xl"
          style={{ background: 'var(--color-surface-soft)' }}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="tab-pill"
              style={{
                fontSize: '13px',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 9999,
                    background: activeTab === tab.id ? 'var(--color-primary-soft)' : 'var(--color-border)',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── REMINDERS LIST ── */}
      <main className="flex-1 overflow-y-auto modal-scroll">
        {filteredReminders.length === 0 ? (
          /* Empty state */
          <div className="empty-state" style={{ paddingTop: 64 }}>
            <img
              src="/images/characters-trimmed/sleepy.png"
              alt="No reminders"
              className="w-24 h-20 object-contain opacity-60 anim-idle-breathing"
            />
            <div>
              <p
                className="font-semibold"
                style={{ fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: 4 }}
              >
                {activeTab === 'completed' ? 'No completed reminders' : 'Nothing here yet'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', maxWidth: 280, lineHeight: 1.5 }}>
                {activeTab === 'completed'
                  ? 'Mark reminders as done and they\'ll appear here.'
                  : 'Create a reminder and your companion will alert you at the right time.'}
              </p>
            </div>
            {activeTab !== 'completed' && (
              <button
                onClick={onNewReminder}
                className="btn-primary"
                style={{ marginTop: 8, fontSize: '13px', padding: '9px 18px' }}
              >
                <Plus size={14} />
                <span>Create Reminder</span>
              </button>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 flex flex-col gap-3">
            {filteredReminders.map((rem) => {
              const char = resolveCharacter(rem);
              const isCompleted = rem.status === 'completed';
              const isOverdue = !isCompleted && rem.triggerTimestamp < Date.now() && !rem.snoozeUntil;

              return (
                <div
                  key={rem.id}
                  className="card card-hover group transition-all duration-150"
                  style={{
                    opacity: isCompleted ? 0.6 : 1,
                    borderColor: isOverdue ? 'var(--color-error)' : undefined,
                    padding: '14px 16px',
                  }}
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    {/* Large authentic character artwork container (~200px wide x ~130px tall) */}
                    <div
                      onClick={() => onTestTrigger(rem)}
                      className="shrink-0 rounded-xl overflow-hidden cursor-pointer relative flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]"
                      style={{
                        width: '200px',
                        minWidth: '180px',
                        maxWidth: '220px',
                        height: '130px',
                        background: 'var(--color-surface-soft)',
                        border: '1px solid var(--color-border)',
                      }}
                      title={`Click to preview alert — ${char.emotion} (${char.action})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Preview ${char.emotion} companion alert`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTestTrigger(rem); }}
                    >
                      {/* Ambient emotional glow */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, ${char.glowColor} 0%, transparent 75%)`,
                        }}
                      />
                      <img
                        src={char.avatarUrl}
                        alt={char.emotion}
                        className="w-full h-full select-none"
                        style={{
                          objectFit: 'contain',
                          objectPosition: 'center',
                          filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.10))',
                        }}
                        draggable={false}
                      />
                    </div>

                    {/* Reminder Content & Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        {/* Title and badges row */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: priorityDot[rem.priority]
                                ? `var(--color-${rem.priority === 'urgent' ? 'error' : rem.priority === 'high' ? 'warning' : 'primary'})`
                                : 'var(--color-text-tertiary)',
                            }}
                          />
                          <h3
                            className="font-semibold truncate"
                            style={{
                              fontSize: '15px',
                              color: isCompleted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              letterSpacing: '-0.01em',
                              margin: 0,
                            }}
                          >
                            {rem.title}
                          </h3>

                          {isOverdue && (
                            <span
                              className="badge badge-error shrink-0"
                              style={{ fontSize: '10px', padding: '2px 7px' }}
                            >
                              Overdue
                            </span>
                          )}

                          <span
                            className="badge shrink-0"
                            style={{
                              fontSize: '10px',
                              padding: '2px 7px',
                              background: 'var(--color-surface-soft)',
                              color: 'var(--color-text-secondary)',
                              border: '1px solid var(--color-border)',
                              fontWeight: 600,
                            }}
                          >
                            {char.emotion}
                          </span>
                        </div>

                        {/* Message description */}
                        {rem.message && (
                          <p
                            className="line-clamp-2"
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-secondary)',
                              lineHeight: 1.45,
                              margin: '2px 0 8px',
                            }}
                          >
                            {rem.message}
                          </p>
                        )}
                      </div>

                      {/* Bottom row: Time, date, recurrence, actions */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-divider)' }}>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="flex items-center gap-1.5"
                            style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 500 }}
                          >
                            <Clock size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                            <span>{formatTime(rem.time || '12:00')}</span>
                          </span>

                          <span
                            className="flex items-center gap-1.5"
                            style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
                          >
                            <Calendar size={12} />
                            <span>{formatDate(rem.date)}</span>
                          </span>

                          {rem.recurrence && rem.recurrence !== 'once' && (
                            <span
                              className="badge badge-muted"
                              style={{ fontSize: '10px', padding: '2px 6px', textTransform: 'capitalize' }}
                            >
                              <RefreshCw size={9} />
                              {rem.recurrence}
                            </span>
                          )}

                          {rem.category && rem.category !== 'General' && (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                              • {rem.category}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Preview Alert button */}
                          <button
                            onClick={() => onTestTrigger(rem)}
                            className="btn-icon"
                            title="Preview alert"
                            aria-label="Preview alert"
                            style={{ width: 32, height: 32 }}
                          >
                            <Play size={13} />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => onEditReminder(rem)}
                            className="btn-icon"
                            title="Edit reminder"
                            aria-label="Edit reminder"
                            style={{ width: 32, height: 32 }}
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Complete toggle */}
                          <button
                            onClick={() => onCompleteReminder(rem.id)}
                            className="btn-icon"
                            title={isCompleted ? 'Mark uncompleted' : 'Mark done'}
                            aria-label={isCompleted ? 'Mark uncompleted' : 'Mark done'}
                            style={{
                              width: 32,
                              height: 32,
                              color: isCompleted ? 'var(--color-success)' : undefined,
                            }}
                          >
                            <CheckCircle2 size={14} />
                          </button>

                          {/* Delete with confirmation */}
                          {confirmDeleteId === rem.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDeleteReminder(rem.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="btn-primary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: 'var(--color-error)',
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn-ghost"
                                style={{ padding: '4px 6px', fontSize: '11px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(rem.id)}
                              className="btn-icon text-muted hover:text-error"
                              title="Delete"
                              aria-label="Delete reminder"
                              style={{ width: 32, height: 32 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <div
        className="px-6 py-2 flex items-center justify-between shrink-0"
        style={{
          borderTop: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
        }}
      >
        <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
          Companion is active · Reminders fire in background
        </p>
        <button
          onClick={onNewReminder}
          style={{
            fontSize: '11px',
            color: 'var(--color-primary)',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Bell size={11} />
          New reminder
        </button>
      </div>
    </div>
  );
};
