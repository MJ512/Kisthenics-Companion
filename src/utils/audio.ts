/**
 * Notification Audio Player for Kisthenics Companion
 * Plays notification sounds located in /notification/ and /notification/others/
 */

export interface NotificationSoundOption {
  id: string;
  label: string;
  group: 'main' | 'others';
  path: string;
}

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  // Main notification folder (top 4)
  {
    id: 'kadinama-irunga',
    label: 'Kadinama Irunga',
    group: 'main',
    path: '/notification/Kadinama%20Irunga.mp3',
  },
  {
    id: 'pichana',
    label: 'Pichana',
    group: 'main',
    path: '/notification/Pichana.mp3',
  },
  {
    id: 'thambikku-umma',
    label: 'Thambikku Umma',
    group: 'main',
    path: '/notification/Thambikku%20Umma.mp3',
  },
  {
    id: 'vanakkam-nanbaragale',
    label: 'Vanakkam Nanbaragale',
    group: 'main',
    path: '/notification/Vanakkam%20Nanbaragale.mp3',
  },

  // Others folder (down, respectively)
  {
    id: 'barbell',
    label: 'barbell',
    group: 'others',
    path: '/notification/others/barbell.wav',
  },
  {
    id: 'chime',
    label: 'chime',
    group: 'others',
    path: '/notification/others/chime.wav',
  },
  {
    id: 'ding',
    label: 'ding',
    group: 'others',
    path: '/notification/others/ding.wav',
  },
  {
    id: 'red',
    label: 'red',
    group: 'others',
    path: '/notification/others/red.wav',
  },
  {
    id: 'weights',
    label: 'weights',
    group: 'others',
    path: '/notification/others/weights.wav',
  },
];

let currentAudio: HTMLAudioElement | null = null;

/**
 * Resolves a sound id or legacy sound type to a file path
 */
export function getSoundPath(soundId?: string): string {
  if (!soundId || soundId === 'default') {
    return NOTIFICATION_SOUNDS[0].path; // Default to first sound
  }

  // Exact ID match
  const found = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
  if (found) return found.path;

  // Legacy fallback mapping
  if (soundId === 'urgent' || soundId === 'alert') return '/notification/others/red.wav';
  if (soundId === 'playful' || soundId === 'motivational') return '/notification/others/ding.wav';
  if (soundId === 'gentle') return '/notification/others/chime.wav';

  return NOTIFICATION_SOUNDS[0].path;
}

/**
 * Plays a notification sound by ID or path at the specified volume (0.0 to 1.0)
 */
export function playCompanionSound(
  soundId: string = 'kadinama-irunga',
  volume: number = 0.8
): void {
  try {
    if (typeof window === 'undefined') return;

    // Stop currently playing preview audio if still playing
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }

    const soundPath = getSoundPath(soundId);
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    currentAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Audio] Playback failed or was blocked by browser:', err);
      });
    }
  } catch (err) {
    console.warn('[Audio] Failed to initialize audio:', err);
  }
}
