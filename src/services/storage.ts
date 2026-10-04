import { Reminder, CompanionSettings } from '../types';
import { CHARACTER_CATALOG } from '../utils/characterRegistry';

const STORAGE_KEY_REMINDERS = 'kisthenics_companion_reminders';
const STORAGE_KEY_SETTINGS = 'kisthenics_companion_settings';

export const DEFAULT_SETTINGS: CompanionSettings = {
  general: {
    launchAtStartup: false,
    startMinimized: false,
    defaultDurationMinutes: 15,
    defaultCharacterId: 'thumbsup',
    autoDetectKeywords: true,
    closeToTray: true,
  },
  notifications: {
    soundEnabled: true,
    soundVolume: 0.8,
    autoDismissSeconds: 0, // persistent until clicked
    animationStyle: 'spring',
    position: 'bottom-right',
    marginRight: 24,
    marginBottom: 24,
    snoozePresets: [5, 10, 15, 30, 60, 1440],
    defaultSnoozeMinutes: 10,
  },
  appearance: {
    theme: 'dark',
    bubbleStyle: 'frosted',
    bubbleColor: '#111827',
  },
  character: {
    characterScale: 1.0,
    enableIdleAnimation: true,
    showSpeechTail: true,
  },
  accessibility: {
    reducedMotion: false,
    fontScale: 1.0,
  },
};

export const INITIAL_SAMPLE_REMINDERS: Reminder[] = [
  {
    id: 'sample-1',
    title: 'Client Strategy Meeting',
    message: 'Review final website deliverables and present next milestones with the engineering lead.',
    time: '17:00',
    date: new Date().toISOString().split('T')[0],
    triggerTimestamp: new Date().setHours(17, 0, 0, 0),
    characterId: 'shock',
    recurrence: 'once',
    priority: 'high',
    status: 'pending',
    snoozeCount: 0,
    createdAt: Date.now() - 3600000,
    category: 'Work',
  },
  {
    id: 'sample-2',
    title: 'Calisthenics & Pushups',
    message: 'Time for evening strength training! Push for 5 sets of dips, pullups and hollow body holds.',
    time: '19:00',
    date: new Date().toISOString().split('T')[0],
    triggerTimestamp: new Date().setHours(19, 0, 0, 0),
    characterId: 'kadinama_irunga',
    recurrence: 'daily',
    priority: 'urgent',
    status: 'pending',
    snoozeCount: 0,
    createdAt: Date.now() - 7200000,
    category: 'Fitness',
  },
  {
    id: 'sample-3',
    title: 'Hydrate & Rest Eyes',
    message: 'You have been staring at the monitor for 2 hours. Drink a tall glass of water and stretch!',
    time: '20:30',
    date: new Date().toISOString().split('T')[0],
    triggerTimestamp: new Date().setHours(20, 30, 0, 0),
    characterId: 'sleepy',
    recurrence: 'daily',
    priority: 'medium',
    status: 'pending',
    snoozeCount: 0,
    createdAt: Date.now() - 1800000,
    category: 'Health',
  },
  {
    id: 'sample-4',
    title: 'Call Family & Check In',
    message: 'Send love and see how their week has been going ❤️',
    time: '21:15',
    date: new Date().toISOString().split('T')[0],
    triggerTimestamp: new Date().setHours(21, 15, 0, 0),
    characterId: 'heart_eye',
    recurrence: 'weekly',
    priority: 'medium',
    status: 'pending',
    snoozeCount: 0,
    createdAt: Date.now() - 86400000,
    category: 'Personal',
  },
];

export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

/**
 * Deep merges `overrides` into `defaults` — only replaces leaf keys, preserves
 * any default keys not present in the stored blob (upgrade-safe).
 */
function deepMergeSettings(defaults: CompanionSettings, overrides?: Partial<CompanionSettings> | null): CompanionSettings {
  if (!overrides || typeof overrides !== 'object') {
    return { ...defaults };
  }
  const result: any = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof CompanionSettings)[]) {
    if (overrides[key] !== undefined && typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])) {
      result[key] = { ...(defaults[key] as any), ...(overrides[key] as any) };
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  return result as CompanionSettings;
}

/**
 * Storage Service combining Tauri SQLite backend + LocalStorage Fallback
 */
export const StorageService = {
  async getReminders(): Promise<Reminder[]> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const list = await invoke<Reminder[]>('get_reminders');
        if (Array.isArray(list)) {
          return list;
        }
      } catch (err) {
        console.warn('Tauri get_reminders failed, checking fallback:', err);
      }
    }

    // LocalStorage Fallback
    const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored reminders', e);
      }
    }

    // Fresh install starts empty by default per production guidelines
    return [];
  },

  async loadDemoData(): Promise<Reminder[]> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const list = await invoke<Reminder[]>('load_demo_reminders');
        if (Array.isArray(list)) {
          localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Tauri load_demo_reminders error:', err);
      }
    }
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(INITIAL_SAMPLE_REMINDERS));
    return INITIAL_SAMPLE_REMINDERS;
  },

  async saveReminder(reminder: Reminder): Promise<Reminder> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const saved = await invoke<Reminder>('save_reminder', { reminder });
        this.updateLocalStorage(saved);
        return saved;
      } catch (err) {
        console.warn('Tauri save_reminder error, using fallback:', err);
      }
    }

    const current = await this.getReminders();
    const index = current.findIndex((r) => r.id === reminder.id);
    let updated: Reminder[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = reminder;
    } else {
      updated = [reminder, ...current];
    }

    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
    return reminder;
  },

  async deleteReminder(id: string): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_reminder', { id });
      } catch (err) {
        console.warn('Tauri delete_reminder error:', err);
      }
    }

    const current = await this.getReminders();
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(filtered));
  },

  async completeReminder(id: string): Promise<Reminder | null> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<Reminder>('complete_reminder', { id });
        this.updateLocalStorage(res);
        return res;
      } catch (err) {
        console.warn('Tauri complete_reminder error:', err);
      }
    }

    const current = await this.getReminders();
    const item = current.find((r) => r.id === id);
    if (!item) return null;

    item.status = 'completed';
    item.completedAt = Date.now();
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(current));
    return item;
  },

  async snoozeReminder(id: string, minutes: number): Promise<Reminder | null> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<Reminder>('snooze_reminder', { id, minutes });
        this.updateLocalStorage(res);
        return res;
      } catch (err) {
        console.warn('Tauri snooze_reminder error:', err);
      }
    }

    const current = await this.getReminders();
    const item = current.find((r) => r.id === id);
    if (!item) return null;

    item.status = 'pending';
    item.snoozeUntil = Date.now() + minutes * 60 * 1000;
    item.snoozeCount = (item.snoozeCount || 0) + 1;
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(current));
    return item;
  },

  async getSettings(): Promise<CompanionSettings> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const val = await invoke<string | null>('get_setting', { key: 'companion_settings' });
        if (val && typeof val === 'string') {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object') {
            return deepMergeSettings(DEFAULT_SETTINGS, parsed);
          }
        }
      } catch (err) {
        console.warn('Tauri get_setting error:', err);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return deepMergeSettings(DEFAULT_SETTINGS, parsed);
        }
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    return { ...DEFAULT_SETTINGS };
  },

  async saveSettings(settings: CompanionSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_setting', {
          key: 'companion_settings',
          value: JSON.stringify(settings),
        });
        await invoke('set_launch_at_startup', { enable: settings.general.launchAtStartup });
      } catch (err) {
        console.warn('Tauri save_setting error:', err);
      }
    }
  },

  async getLaunchAtStartup(): Promise<boolean> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('get_launch_at_startup');
      } catch (err) {
        console.warn('Tauri get_launch_at_startup error:', err);
      }
    }
    return false;
  },

  async triggerDesktopAlert(reminder: Reminder, stackedCount: number = 1): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const settings = await this.getSettings();
        await invoke('show_reminder_window', {
          alertPayload: JSON.stringify(reminder),
          marginRight: settings.notifications.marginRight,
          marginBottom: settings.notifications.marginBottom,
          stackedCount,
        });
      } catch (err) {
        console.warn('Failed to invoke show_reminder_window:', err);
      }
    }
  },

  async dismissDesktopAlert(): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('hide_reminder_window');
      } catch (err) {
        console.warn('Failed to hide reminder window:', err);
      }
    }
  },

  updateLocalStorage(item: Reminder) {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (!raw) return;
    try {
      const list: Reminder[] = JSON.parse(raw);
      const idx = list.findIndex((r) => r.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.unshift(item);
      }
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(list));
    } catch {
      // ignore
    }
  },
};
