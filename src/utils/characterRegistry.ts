import { CharacterAsset, MessageStyle } from '../types';

/**
 * Standard registry built from the 12 authentic character PNGs discovered in public/images
 * Filenames are preserved exactly and represent their emotion/action.
 */
export const CHARACTER_CATALOG: CharacterAsset[] = [
  {
    id: 'kadinama_irunga',
    filename: 'kadinama irunga.png',
    emotion: 'Determined',
    action: 'Hardcore Grit & Flex',
    description: 'High-discipline perseverance companion (Kadinama Irunga!) for development, heavy work, gym, and calisthenics.',
    defaultMessageStyle: 'motivational',
    keywords: [
      'work', 'coding', 'development', 'build', 'project', 'gym', 'workout', 
      'deadline', 'calisthenics', 'kisthenics', 'pushup', 'pullup', 'train', 
      'training', 'exercise', 'discipline', 'grind', 'hard', 'sweat', 'heavy', 'fitness'
    ],
    avatarUrl: encodeURI('/images/characters-trimmed/kadinama irunga.png'),
    originalAvatarUrl: encodeURI('/images/kadinama irunga.png'),
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    catchphrase: "Kadinama Irunga! Push your limits today! 💪💥",
    soundType: 'motivational',
    arrivalAnimation: 'flex',
  },
  {
    id: 'cool',
    filename: 'cool.png',
    emotion: 'Cool',
    action: 'Confident & Chilled',
    description: 'Sunglasses swagger for deploys, launches, finished work, and shipping smoothly.',
    defaultMessageStyle: 'confident',
    keywords: [
      'deploy', 'launch', 'finished', 'production', 'shipping', 'work', 
      'smooth', 'vibe', 'chill', 'style', 'casual', 'win', 'easy', 'music', 'coffee'
    ],
    avatarUrl: '/images/characters-trimmed/cool.png',
    originalAvatarUrl: '/images/cool.png',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    catchphrase: "Stay cool. You got this on lock. 😎",
    soundType: 'chime',
    arrivalAnimation: 'glide',
  },
  {
    id: 'shock',
    filename: 'shock.png',
    emotion: 'Shocked',
    action: 'Alert & Astonished',
    description: 'Quick-response alert for imminent meetings, calls, interviews, flights, and appointments starting right now.',
    defaultMessageStyle: 'startled',
    keywords: [
      'meeting', 'call', 'appointment', 'starting', 'urgent', 'zoom', 
      'interview', 'flight', 'now', 'hurry', 'alarm', 'shock', 'asap', 'imminent'
    ],
    avatarUrl: '/images/characters-trimmed/shock.png',
    originalAvatarUrl: '/images/shock.png',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    catchphrase: "WAIT! 😱 Your event starts right now!",
    soundType: 'alert',
    arrivalAnimation: 'pop',
  },
  {
    id: 'angry',
    filename: 'angry.png',
    emotion: 'Angry',
    action: 'Stern & Uncompromising',
    description: 'Stern accountability partner for overdue deadlines, late tasks, missed commitments, and important payments.',
    defaultMessageStyle: 'urgent',
    keywords: [
      'deadline', 'overdue', 'late', 'missed', 'important', 'payment', 
      'tax', 'bill', 'debt', 'submit', 'procrastinat', 'promised', 'angry', 'stop'
    ],
    avatarUrl: '/images/characters-trimmed/angry.png',
    originalAvatarUrl: '/images/angry.png',
    badgeColor: 'bg-red-600/20 text-red-300 border-red-600/30',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    catchphrase: "Bro... you said you'd do this earlier! 😤",
    soundType: 'urgent',
    arrivalAnimation: 'stamp',
  },
  {
    id: 'sleepy',
    filename: 'sleepy.png',
    emotion: 'Sleepy',
    action: 'Resting & Drowsy',
    description: 'Calm, gentle companion reminding you to hydrate, take a break, rest your eyes, and get good sleep.',
    defaultMessageStyle: 'gentle',
    keywords: [
      'sleep', 'bed', 'rest', 'break', 'late night', 'water', 
      'drink', 'hydrate', 'stretch', 'tired', 'nap', 'relax', 'night', 'meds'
    ],
    avatarUrl: '/images/characters-trimmed/sleepy.png',
    originalAvatarUrl: '/images/sleepy.png',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    catchphrase: "Still working? Maybe time for a little breather 😴",
    soundType: 'gentle',
    arrivalAnimation: 'float',
  },
  {
    id: 'thumbsup',
    filename: 'thumbsup.png',
    emotion: 'Thumbs Up',
    action: 'Supportive & Ready',
    description: 'Supportive partner for everyday chores, completed tasks, good habits, and daily routines.',
    defaultMessageStyle: 'encouraging',
    keywords: [
      'done', 'completed', 'approved', 'success', 'good', 'finished', 
      'task', 'todo', 'routine', 'chores', 'clean', 'tidy', 'email'
    ],
    avatarUrl: '/images/characters-trimmed/thumbsup.png',
    originalAvatarUrl: '/images/thumbsup.png',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    catchphrase: "Time to get this done! You got this! 👍",
    soundType: 'chime',
    arrivalAnimation: 'bounce',
  },
  {
    id: 'thumbsup_cool',
    filename: 'thumbsup cool.png',
    emotion: 'Cool Approval',
    action: 'Approved & Stoked',
    description: 'Celebratory affirmation for major milestones, streaks, wins, and high scores.',
    defaultMessageStyle: 'confident',
    keywords: [
      'approved', 'nice', 'great', 'perfect', 'awesome', 'milestone', 
      'streak', 'victory', 'level', 'yes', 'super', 'stellar'
    ],
    avatarUrl: encodeURI('/images/characters-trimmed/thumbsup cool.png'),
    originalAvatarUrl: encodeURI('/images/thumbsup cool.png'),
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    catchphrase: "Look at that progress! Keep this roll going! 🤙",
    soundType: 'motivational',
    arrivalAnimation: 'glide',
  },
  {
    id: 'heart_eye',
    filename: 'heart eye.png',
    emotion: 'Loving',
    action: 'Affectionate & Caring',
    description: 'Warm, heartfelt reminder for loved ones, family, birthdays, anniversaries, and personal care.',
    defaultMessageStyle: 'affectionate',
    keywords: [
      'birthday', 'love', 'special', 'girlfriend', 'boyfriend', 'family', 
      'anniversary', 'mom', 'dad', 'wife', 'husband', 'gift', 'date', 'care', 'sweetheart'
    ],
    avatarUrl: encodeURI('/images/characters-trimmed/heart eye.png'),
    originalAvatarUrl: encodeURI('/images/heart eye.png'),
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    catchphrase: "Remember with love! Show them you care today ❤️",
    soundType: 'gentle',
    arrivalAnimation: 'bounce',
  },
  {
    id: 'cry',
    filename: 'cry.png',
    emotion: 'Crying',
    action: 'Pleading & Desperate',
    description: 'Emotional urgency when you cannot afford to drop the ball on something critical.',
    defaultMessageStyle: 'pleading',
    keywords: [
      'missed', 'failed', 'sorry', 'forgot', 'sad', 'emergency', 
      'please', 'disaster', 'rescue', 'cry', 'crucial', 'critical'
    ],
    avatarUrl: '/images/characters-trimmed/cry.png',
    originalAvatarUrl: '/images/cry.png',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    catchphrase: "Please don't forget this! I'm begging you! 😭",
    soundType: 'alert',
    arrivalAnimation: 'pop',
  },
  {
    id: 'question',
    filename: 'question .png',
    emotion: 'Curious',
    action: 'Inquiring & Puzzled',
    description: 'Inquiring check-in for questions, reviews, status checks, and follow-ups.',
    defaultMessageStyle: 'inquisitive',
    keywords: [
      'question', 'check', 'why', 'what', 'investigate', 'inquiry', 
      'status', 'review', 'verify', 'confirm', 'ask', 'followup'
    ],
    avatarUrl: encodeURI('/images/characters-trimmed/question .png'),
    originalAvatarUrl: encodeURI('/images/question .png'),
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    catchphrase: "Quick check-in! Did you get a chance to look at this? 🧐",
    soundType: 'chime',
    arrivalAnimation: 'glide',
  },
  {
    id: 'silence',
    filename: 'silence.png',
    emotion: 'Silent',
    action: 'Quiet & Focused',
    description: 'Discreet, non-intrusive reminder for deep work, concentration, reading, and meditation.',
    defaultMessageStyle: 'quiet',
    keywords: [
      'focus', 'deep work', 'concentrate', 'quiet', 'study', 
      'meditate', 'read', 'secret', 'shh', 'peace', 'stealth'
    ],
    avatarUrl: '/images/characters-trimmed/silence.png',
    originalAvatarUrl: '/images/silence.png',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    catchphrase: "Shh... your deep focus block starts now. 🤫",
    soundType: 'gentle',
    arrivalAnimation: 'float',
  },
  {
    id: 'laugh',
    filename: 'Laugh.png',
    emotion: 'Laughing',
    action: 'Playful & Joyful',
    description: 'Brings high energy, playful jokes, and laughs to keep you smiling while productive.',
    defaultMessageStyle: 'playful',
    keywords: [
      'fun', 'funny', 'casual', 'break', 'joke', 'haha', 'lol', 
      'party', 'game', 'social', 'play', 'laugh', 'smile', 'happy'
    ],
    avatarUrl: '/images/characters-trimmed/Laugh.png',
    originalAvatarUrl: '/images/Laugh.png',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    catchphrase: "Hey! Don't let this slip away! 😂",
    soundType: 'playful',
    arrivalAnimation: 'bounce',
  },
];

/**
 * Normalizes any filename to a CharacterAsset dynamically
 */
export function normalizeFilenameToCharacter(rawFilename: string): CharacterAsset {
  const cleanName = rawFilename
    .replace(/\.[^/.]+$/, '')
    .trim();

  // Guard against 'auto' filename
  if (!cleanName || cleanName.toLowerCase() === 'auto') {
    return CHARACTER_CATALOG[0];
  }

  const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const existing = CHARACTER_CATALOG.find(
    (c) => c.id === id || c.filename.toLowerCase() === rawFilename.toLowerCase().trim()
  );
  if (existing) {
    return existing;
  }

  const words = cleanName.split(/[\s_-]+/).filter(Boolean);
  const capitalized = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return {
    id,
    filename: rawFilename,
    emotion: capitalized,
    action: `${capitalized} Mode`,
    description: `Custom desktop companion expressing ${capitalized}.`,
    defaultMessageStyle: 'encouraging',
    keywords: words.map((w) => w.toLowerCase()),
    avatarUrl: encodeURI(`/images/characters-trimmed/${rawFilename}`),
    originalAvatarUrl: encodeURI(`/images/${rawFilename}`),
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    catchphrase: `Hey! Time for your ${capitalized} reminder!`,
    soundType: 'chime',
    arrivalAnimation: 'bounce',
  };
}

/**
 * Intelligent deterministic keyword matching system
 * Gives higher weight to exact whole-word matches (\bword\b) and longer keywords
 */
export function inferCharacterForContext(text: string): CharacterAsset {
  const clean = (text || '').toLowerCase();
  if (!clean.trim()) {
    return CHARACTER_CATALOG[0]; // Determined default (kadinama_irunga)
  }

  let bestMatch: CharacterAsset = CHARACTER_CATALOG[0];
  let highestScore = 0;

  for (const char of CHARACTER_CATALOG) {
    let score = 0;
    for (const kw of char.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wholeWordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (wholeWordRegex.test(clean)) {
        // Exact whole-word match bonus
        score += 15 + kw.length * 2;
      } else if (clean.includes(kw)) {
        // Substring match
        score += kw.length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = char;
    }
  }

  return bestMatch;
}

/**
 * Resolves character asset for a reminder (Manual selection ALWAYS overrides Auto Match)
 * Completely guards against 'auto' returning missing images or '/images/auto.png'.
 */
export function resolveCharacter(reminder?: {
  characterId?: string | 'auto' | null;
  resolvedCharacterId?: string | null;
  title?: string;
  message?: string;
  [key: string]: any;
}): CharacterAsset {
  if (!reminder) {
    return CHARACTER_CATALOG[0];
  }

  // 1. Manual characterId override (must be a valid catalog ID and not 'auto')
  const charId = reminder.characterId || reminder.character_id;
  if (charId && charId !== 'auto') {
    const manual = CHARACTER_CATALOG.find(
      (c) => c.id.toLowerCase() === String(charId).toLowerCase()
    );
    if (manual) return manual;
  }

  // 2. Previously resolved character (must not be 'auto')
  const resolvedId = reminder.resolvedCharacterId || reminder.resolved_character_id;
  if (resolvedId && resolvedId !== 'auto') {
    const resolved = CHARACTER_CATALOG.find(
      (c) => c.id.toLowerCase() === String(resolvedId).toLowerCase()
    );
    if (resolved) return resolved;
  }

  // 3. Fallback to keyword inferencing from title + message
  const text = `${reminder.title || ''} ${reminder.message || ''}`.trim();
  return inferCharacterForContext(text);
}
