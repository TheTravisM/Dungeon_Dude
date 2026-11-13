export interface VoiceRule {
  maxVoices: number;
  minIntervalMs: number;
}

export interface VoiceLimiter {
  /** Records a start and returns true only when both limits allow it. */
  tryAcquire(id: string, nowMs: number, rule: VoiceRule): boolean;
  /** One active voice of `id` ended. Never drops below zero. */
  release(id: string): void;
  reset(): void;
}

interface VoiceEntry {
  active: number;
  lastStart: number | null;
}

/**
 * Per-sound concurrency and retrigger limiting. Kept framework-free so the
 * AudioManager can own audio lifecycle while this stays trivially testable.
 */
export function createVoiceLimiter(): VoiceLimiter {
  const entries = new Map<string, VoiceEntry>();

  return {
    tryAcquire(id, nowMs, rule) {
      if (rule.maxVoices <= 0) return false;

      let entry = entries.get(id);
      if (!entry) {
        entry = { active: 0, lastStart: null };
        entries.set(id, entry);
      }

      if (entry.active >= rule.maxVoices) return false;
      if (
        entry.lastStart !== null &&
        nowMs - entry.lastStart < rule.minIntervalMs
      ) {
        return false;
      }

      entry.active += 1;
      entry.lastStart = nowMs;
      return true;
    },

    release(id) {
      const entry = entries.get(id);
      if (!entry) return;
      entry.active = Math.max(0, entry.active - 1);
    },

    reset() {
      entries.clear();
    },
  };
}
