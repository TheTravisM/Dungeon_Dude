import { clamp01, DEFAULT_MIXER, type MixerKey, type MixerState } from './buses';

export const PREFS_KEY = 'dungeon-dude:audio:v1';

/** The slice of localStorage this module needs; injectable for tests. */
export interface PrefsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEYS: readonly MixerKey[] = ['master', 'sfx', 'ambient', 'voice', 'ui'];

function fresh(): MixerState {
  return { volumes: { ...DEFAULT_MIXER.volumes }, muted: DEFAULT_MIXER.muted };
}

/** Validates field by field so one bad value cannot discard the rest. */
export function loadMixer(storage: PrefsStorage | null): MixerState {
  const result = fresh();
  if (!storage) return result;

  let parsed: unknown;
  try {
    const raw = storage.getItem(PREFS_KEY);
    if (!raw) return result;
    parsed = JSON.parse(raw);
  } catch {
    return result;
  }
  if (typeof parsed !== 'object' || parsed === null) return result;

  const record = parsed as Record<string, unknown>;
  const volumes = record.volumes;
  if (typeof volumes === 'object' && volumes !== null) {
    const stored = volumes as Record<string, unknown>;
    for (const key of KEYS) {
      const value = stored[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        result.volumes[key] = clamp01(value);
      }
    }
  }
  if (typeof record.muted === 'boolean') result.muted = record.muted;
  return result;
}

/** Best-effort persistence; blocked or full storage must never break audio. */
export function saveMixer(
  storage: PrefsStorage | null,
  mixer: MixerState
): void {
  if (!storage) return;
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(mixer));
  } catch {
    return;
  }
}
