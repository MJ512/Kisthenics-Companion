import React, { useState, useEffect, useCallback } from 'react';
import { Reminder, CompanionSettings, CharacterAsset } from './types';
import { StorageService, DEFAULT_SETTINGS, isTauriEnvironment } from './services/storage';
import { MainDashboard } from './components/MainDashboard';
import { DesktopReminderPopup } from './components/DesktopReminderPopup';
import { NewReminderModal } from './components/NewReminderModal';
import { SettingsPage } from './components/SettingsPage';
import { CharacterRosterModal } from './components/CharacterRosterModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Apply theme class to <html> so CSS vars switch cleanly
function applyTheme(theme: 'dark' | 'light' | 'system') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }
}

/**
 * Detect whether current window is the dedicated transparent reminder alert popup.
 * Checks both native Tauri window label and URL query/hash parameters.
 */
function detectIsAlertWindow(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Direct synchronous check of Tauri window metadata
  try {
    const internals = (window as any).__TAURI_INTERNALS__;
    const label = internals?.metadata?.currentWindow?.label;
    if (label === 'reminder') return true;
    if (label === 'main') return false;
  } catch {
    // ignore
  }

  // 2. URL search / hash / path fallback (for dev server, browser testing, and deep links)
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const pathname = window.location.pathname || '';
  return (
    search.includes('mode=alert') ||
    search.includes('reminder') ||
    hash.includes('alert') ||
    pathname.includes('alert')
  );
}

/**
 * Safely parses reminder payload whether delivered as JSON string or parsed object.
 * Normalizes snake_case database fields to camelCase Reminder interface.
 */
function parseReminderPayload(raw: unknown): Reminder | null {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('[Kisthenics] Failed to parse reminder JSON string:', e);
      return null;
    }
  }

  if (typeof parsed === 'object' && parsed !== null && 'id' in parsed) {
    const r = parsed as any;
    return {
      id: String(r.id),
      title: String(r.title || ''),
      message: String(r.message || ''),
      time: String(r.time || ''),
      date: String(r.date || ''),
      triggerTimestamp: Number(r.triggerTimestamp ?? r.trigger_timestamp ?? Date.now()),
      characterId: String(r.characterId ?? r.character_id ?? 'auto'),
      resolvedCharacterId: r.resolvedCharacterId ?? r.resolved_character_id ?? undefined,
      recurrence: r.recurrence || 'once',
      customDays: r.customDays ?? r.custom_days,
      priority: r.priority || 'medium',
      status: r.status || 'pending',
      snoozeUntil: r.snoozeUntil ?? r.snooze_until ?? undefined,
      snoozeCount: Number(r.snoozeCount ?? r.snooze_count ?? 0),
      createdAt: Number(r.createdAt ?? r.created_at ?? Date.now()),
      completedAt: r.completedAt ?? r.completed_at ?? undefined,
      category: r.category,
      soundType: r.soundType ?? r.sound_type,
      durationSeconds: r.durationSeconds ?? r.duration_seconds,
    };
  }

  return null;
}

export const App: React.FC = () => {
  const [isAlertMode, setIsAlertMode] = useState<boolean>(() => detectIsAlertWindow());

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<CompanionSettings>(DEFAULT_SETTINGS);
  const [activeAlertReminders, setActiveAlertReminders] = useState<Reminder[]>([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // Asynchronously verify window label in Tauri environment
  useEffect(() => {
    if (!isTauriEnvironment()) return;
    const verifyWindow = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        if (win?.label === 'reminder') {
          setIsAlertMode(true);
        } else if (win?.label === 'main') {
          setIsAlertMode(false);
        }
      } catch (err) {
        // ignore
      }
    };
    verifyWindow();
  }, []);

  // Apply theme whenever settings change
  useEffect(() => {
    applyTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  // Watch system theme if mode=system
  useEffect(() => {
    if (settings.appearance.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.appearance.theme]);

  const refreshData = useCallback(async () => {
    try {
      const list = await StorageService.getReminders();
      if (Array.isArray(list)) {
        setReminders(list);
      }
      const set = await StorageService.getSettings();
      if (set && typeof set === 'object' && set.appearance) {
        setSettings(set);
      }
    } catch (err) {
      console.warn('[Kisthenics] refreshData caught error:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Tauri event listeners
  useEffect(() => {
    if (!isTauriEnvironment()) return;

    let unlistenAlert: (() => void) | undefined;
    let unlistenDue: (() => void) | undefined;
    let unlistenTest: (() => void) | undefined;
    let unlistenNew: (() => void) | undefined;
    let unlistenToday: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');

        const handleAlertEvent = (payload: unknown) => {
          const rem = parseReminderPayload(payload);
          if (rem) {
            setActiveAlertReminders((prev) => {
              if (prev.some((r) => r.id === rem.id)) return prev;
              return [rem, ...prev];
            });
          }
        };

        // Received when Rust targets the reminder window
        unlistenAlert = await listen<any>('active-reminder', (event) => {
          handleAlertEvent(event.payload);
        });

        // Broadcasted scheduler alert event
        unlistenDue = await listen<any>('reminder-due', (event) => {
          if (detectIsAlertWindow()) {
            handleAlertEvent(event.payload);
          }
          refreshData();
        });

        unlistenTest = await listen('trigger-test-alert', async () => {
          const currentList = await StorageService.getReminders();
          if (currentList.length > 0) {
            triggerPopupAlert(currentList[0]);
          } else {
            setIsNewModalOpen(true);
          }
        });

        unlistenNew = await listen('open-new-modal', () => {
          setIsNewModalOpen(true);
        });

        unlistenToday = await listen('switch-tab-today', () => {
          // handled via dashboard
        });

        unlistenSettings = await listen('open-settings-modal', () => {
          setCurrentView('settings');
        });
      } catch (err) {
        console.warn('[Kisthenics] Failed to register Tauri event listeners:', err);
      }
    };

    setupListeners();

    return () => {
      if (unlistenAlert) unlistenAlert();
      if (unlistenDue) unlistenDue();
      if (unlistenTest) unlistenTest();
      if (unlistenNew) unlistenNew();
      if (unlistenToday) unlistenToday();
      if (unlistenSettings) unlistenSettings();
    };
  }, [refreshData]);

  // Browser-only scheduler fallback
  useEffect(() => {
    if (isTauriEnvironment()) return;
    const timer = setInterval(async () => {
      const now = Date.now();
      const current = await StorageService.getReminders();
      for (const rem of current) {
        if (rem.status === 'pending') {
          const dueTime = rem.snoozeUntil || rem.triggerTimestamp;
          if (dueTime <= now) {
            triggerPopupAlert(rem);
            rem.status = 'snoozed';
            await StorageService.saveReminder(rem);
          }
        }
      }
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const triggerPopupAlert = useCallback(async (rem: Reminder) => {
    if (isTauriEnvironment()) {
      await StorageService.triggerDesktopAlert(rem, 1);
    } else {
      setActiveAlertReminders((prev) => {
        if (prev.some((r) => r.id === rem.id)) return prev;
        return [rem, ...prev];
      });
    }
  }, []);

  const handleDone = async (id: string) => {
    await StorageService.completeReminder(id);
    setActiveAlertReminders((prev) => prev.filter((r) => r.id !== id));
    if (activeAlertReminders.length <= 1) {
      await StorageService.dismissDesktopAlert();
    }
    refreshData();
  };

  const handleSnooze = async (id: string, minutes: number) => {
    await StorageService.snoozeReminder(id, minutes);
    setActiveAlertReminders((prev) => prev.filter((r) => r.id !== id));
    if (activeAlertReminders.length <= 1) {
      await StorageService.dismissDesktopAlert();
    }
    refreshData();
  };

  const handleDismiss = async (id: string) => {
    setActiveAlertReminders((prev) => prev.filter((r) => r.id !== id));
    if (activeAlertReminders.length <= 1) {
      await StorageService.dismissDesktopAlert();
    }
  };

  const handleSaveReminder = async (rem: Reminder) => {
    await StorageService.saveReminder(rem);
    refreshData();
  };

  const handleDeleteReminder = async (id: string) => {
    await StorageService.deleteReminder(id);
    refreshData();
  };

  const handleSaveSettings = async (newSettings: CompanionSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  const handleTestCharacter = (char: CharacterAsset) => {
    const testReminder: Reminder = {
      id: `test-${Date.now()}`,
      title: `${char.emotion} Companion Alert`,
      message: `"${char.catchphrase}" — Your personal desktop companion is here to keep you focused!`,
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      date: new Date().toISOString().split('T')[0],
      triggerTimestamp: Date.now(),
      characterId: char.id,
      resolvedCharacterId: char.id,
      recurrence: 'once',
      priority: 'high',
      status: 'pending',
      snoozeCount: 0,
      createdAt: Date.now(),
      category: 'Preview',
    };
    triggerPopupAlert(testReminder);
  };

  // ── REMINDER ALERT WINDOW — transparent popup only ──
  if (isAlertMode) {
    return (
      <ErrorBoundary>
        <div className="w-full h-full bg-transparent overflow-hidden select-none pointer-events-none">
          <DesktopReminderPopup
            reminders={activeAlertReminders}
            settings={settings}
            onDone={handleDone}
            onSnooze={handleSnooze}
            onDismiss={handleDismiss}
            isStandaloneWindow={true}
          />
        </div>
      </ErrorBoundary>
    );
  }

  // ── MAIN APPLICATION WINDOW — stable dashboard ──
  return (
    <ErrorBoundary>
      <div className="app-shell">
        {currentView === 'settings' ? (
          <SettingsPage
            settings={settings}
            onSave={handleSaveSettings}
            onBack={() => setCurrentView('dashboard')}
          />
        ) : (
          <MainDashboard
            reminders={reminders}
            settings={settings}
            onNewReminder={() => {
              setEditingReminder(null);
              setIsNewModalOpen(true);
            }}
            onEditReminder={(rem) => {
              setEditingReminder(rem);
              setIsNewModalOpen(true);
            }}
            onDeleteReminder={handleDeleteReminder}
            onCompleteReminder={handleDone}
            onSnoozeReminder={handleSnooze}
            onTestTrigger={triggerPopupAlert}
            onOpenSettings={() => setCurrentView('settings')}
            onOpenRoster={() => setIsRosterOpen(true)}
          />
        )}

        {/* Fallback in-page popup only for browser testing outside of Tauri */}
        {!isTauriEnvironment() && (
          <DesktopReminderPopup
            reminders={activeAlertReminders}
            settings={settings}
            onDone={handleDone}
            onSnooze={handleSnooze}
            onDismiss={handleDismiss}
            isStandaloneWindow={false}
          />
        )}

        <NewReminderModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingReminder(null);
          }}
          onSave={handleSaveReminder}
          initialReminder={editingReminder}
        />

        <CharacterRosterModal
          isOpen={isRosterOpen}
          onClose={() => setIsRosterOpen(false)}
          onTestCharacter={handleTestCharacter}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
