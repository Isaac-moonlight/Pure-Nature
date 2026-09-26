/**
 * Web Audio API synthesizer for restaurant sounds
 * Provides zero-latency, realistic acoustic chimes without external audio assets.
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

/**
 * Kitchen Service Bell - dual brass chime (classic "ding ding" table bell)
 */
export function playOrderBell(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playDing = (delay: number, pitchMultiplier = 1) => {
      const now = ctx.currentTime + delay;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5 * pitchMultiplier, now); // C6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2093 * pitchMultiplier, now); // C7

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
    };

    playDing(0, 1);
    playDing(0.18, 1.25);
  } catch (e) {
    console.debug('Audio play skipped:', e);
  }
}

/**
 * Waiter Call alert chime
 */
export function playWaiterCallChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio note sequence
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(739.99, now + 0.12); // F#5
    osc.frequency.setValueAtTime(880.00, now + 0.24); // A5

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.95);
  } catch (e) {
    console.debug('Audio play skipped:', e);
  }
}

/**
 * Soft status update chime (Customer order progression)
 */
export function playStatusUpdateSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {
    console.debug('Audio play skipped:', e);
  }
}
