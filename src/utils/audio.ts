/**
 * Web Audio API synthesizer for companion audio alerts
 * Requires no external audio files, operates instantly with zero latency
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCompanionSound(
  type: 'playful' | 'gentle' | 'urgent' | 'chime' | 'motivational' | 'alert' = 'chime',
  volume: number = 0.7
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'playful': {
        // Joyful ascending arpeggio (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.36);
        });
        break;
      }

      case 'gentle': {
        // Soft calming ambient chime (warm sine harmonic)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // A4
        osc2.frequency.setValueAtTime(659.25, now); // E5

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.25);
        osc2.stop(now + 1.25);
        break;
      }

      case 'urgent': {
        // Two snappy assertive alert pings
        [0, 0.15].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now + offset); // A5
          osc.frequency.exponentialRampToValueAtTime(587.33, now + offset + 0.1); // D5

          gain.gain.setValueAtTime(0.3, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + offset);
          osc.stop(now + offset + 0.13);
        });
        break;
      }

      case 'motivational': {
        // High-energy power chime (F4 -> A4 -> C5 -> F5)
        const notes = [349.23, 440, 523.25, 698.46];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.4, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.46);
        });
        break;
      }

      case 'alert': {
        // Startled radar ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'chime':
      default: {
        // Classic pleasant bell chime (G5 -> C6)
        [783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.4, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.61);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio playback not supported or blocked:', err);
  }
}
