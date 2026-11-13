import { describe, expect, it } from 'vitest';
import { DEFAULT_MIXER, type MixerState } from './buses';
import {
  PREFS_KEY,
  loadMixer,
  saveMixer,
  type PrefsStorage,
} from './prefs';

class MemoryStorage implements PrefsStorage {
  readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const customMixer: MixerState = {
  volumes: { master: 0.4, sfx: 0.3, ambient: 0, voice: 1, ui: 0.9 },
  muted: true,
};

describe('audio preferences', () => {
  it('round-trips a mixer through storage', () => {
    const storage = new MemoryStorage();
    saveMixer(storage, customMixer);

    expect(loadMixer(storage)).toEqual(customMixer);
    expect(storage.data.has(PREFS_KEY)).toBe(true);
  });

  it('returns defaults for missing, corrupt, or non-object data', () => {
    const storage = new MemoryStorage();
    expect(loadMixer(storage)).toEqual(DEFAULT_MIXER);

    storage.setItem(PREFS_KEY, '{not json');
    expect(loadMixer(storage)).toEqual(DEFAULT_MIXER);

    storage.setItem(PREFS_KEY, 'null');
    expect(loadMixer(storage)).toEqual(DEFAULT_MIXER);
  });

  it('validates each field and clamps numbers', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      PREFS_KEY,
      JSON.stringify({
        volumes: {
          master: 'loud',
          sfx: 4,
          ambient: -2,
          voice: null,
          ui: 0.3,
          extra: 0.5,
        },
        muted: 'yes',
        unknown: true,
      })
    );

    const loaded = loadMixer(storage);
    expect(loaded.volumes).toEqual({
      master: DEFAULT_MIXER.volumes.master,
      sfx: 1,
      ambient: 0,
      voice: DEFAULT_MIXER.volumes.voice,
      ui: 0.3,
    });
    expect(loaded.muted).toBe(false);
    expect(Object.keys(loaded.volumes)).toHaveLength(5);
  });

  it('never throws when storage is blocked', () => {
    const blocked: PrefsStorage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('full');
      },
    };

    expect(() => loadMixer(blocked)).not.toThrow();
    expect(loadMixer(blocked)).toEqual(DEFAULT_MIXER);
    expect(() => saveMixer(blocked, customMixer)).not.toThrow();
  });

  it('handles null storage and returns a fresh object each call', () => {
    expect(loadMixer(null)).toEqual(DEFAULT_MIXER);
    const first = loadMixer(null);
    const second = loadMixer(null);
    expect(first).not.toBe(second);
    expect(first.volumes).not.toBe(second.volumes);

    first.volumes.master = 0;
    expect(second.volumes.master).toBe(DEFAULT_MIXER.volumes.master);
    expect(DEFAULT_MIXER.volumes.master).toBe(0.8);
  });
});
