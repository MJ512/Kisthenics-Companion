export type MessageStyle = 
  | 'playful' 
  | 'gentle' 
  | 'urgent' 
  | 'confident' 
  | 'motivational' 
  | 'startled' 
  | 'affectionate' 
  | 'inquisitive' 
  | 'quiet' 
  | 'encouraging'
  | 'pleading';

export interface CharacterAsset {
  id: string;
  filename: string;
  emotion: string;
  action: string;
  description: string;
  defaultMessageStyle: MessageStyle;
  keywords: string[];
  avatarUrl: string;
  originalAvatarUrl?: string;
  badgeColor: string;
  glowColor: string;
  catchphrase: string;
  soundType: 'playful' | 'gentle' | 'urgent' | 'chime' | 'motivational' | 'alert';
  arrivalAnimation: 'bounce' | 'glide' | 'pop' | 'stamp' | 'flex' | 'float';
}

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'weekdays' | 'custom';
export type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'dismissed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Reminder {
  id: string;
  title: string;
  message: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  triggerTimestamp: number; // Unix timestamp in ms
  characterId: string | 'auto';
  resolvedCharacterId?: string;
  recurrence: RecurrenceType;
  customDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  priority: PriorityLevel;
  status: ReminderStatus;
  snoozeUntil?: number; // Unix timestamp in ms
  snoozeCount: number;
  createdAt: number;
  completedAt?: number;
  category?: string;
  soundType?: string;
  durationSeconds?: number;
}

export interface CompanionSettings {
  general: {
    launchAtStartup: boolean;
    startMinimized: boolean;
    defaultDurationMinutes: number;
    defaultCharacterId: string;
    autoDetectKeywords: boolean;
    closeToTray?: boolean;
  };
  notifications: {
    soundEnabled: boolean;
    soundVolume: number;
    autoDismissSeconds: number; // 0 = persistent until action
    animationStyle: 'spring' | 'gentle' | 'snappy' | 'none';
    position: 'bottom-right' | 'bottom-left' | 'top-right';
    marginRight: number; // px
    marginBottom: number; // px
    snoozePresets: number[]; // minutes
    defaultSnoozeMinutes?: number;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    bubbleStyle: 'frosted' | 'glass-tint' | 'solid';
    bubbleColor: string;
  };
  character: {
    characterScale: number; // 0.8 to 1.3
    enableIdleAnimation: boolean;
    showSpeechTail: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    fontScale: number; // 0.85 to 1.25
  };
}

export interface ActiveReminderAlert {
  reminder: Reminder;
  character: CharacterAsset;
  triggeredAt: number;
}
