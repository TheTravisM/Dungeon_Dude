import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudioManager } from './AudioManager';
import {
  SOUND_IDS,
  SOUND_MANIFEST,
  type SoundDef,
  type SoundId,
} from './audio/manifest';
import type { PrefsStorage } from './audio/prefs';
import type { AudioDeps, HowlHandlers, HowlLike } from './audio/types';

class MemoryStorage implements PrefsStorage {
  readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

interface FakeCalls {
  played: number[];
  volumes: Array<{ volume: number; id: number }>;
  rates: Array<{ rate: number; id: number }>;
  pans: Array<{ pan: number; id: number }>;
  stops: Array<number | undefined>;
  unloads: number;
}

interface FakeHowl extends HowlLike {
  readonly def: SoundDef & { id: SoundId };
  readonly handlers: HowlHandlers;
  readonly calls: FakeCalls;
}

function createFakes() {
  const howls = new Map<SoundId, FakeHowl>();
  const created: SoundId[] = [];
  let nextPlaybackId = 1;

  const createHowl = (
    def: SoundDef & { id: SoundId },
    handlers: HowlHandlers
  ): HowlLike => {
    const calls: FakeCalls = {
      played: [],
      volumes: [],
      rates: [],
      pans: [],
      stops: [],
      unloads: 0,
    };
    const fake: FakeHowl = {
      def,
      handlers,
      calls,
      play() {
        const id = nextPlaybackId;
        nextPlaybackId += 1;
        calls.played.push(id);
        return id;
      },
      stop(id) {
        calls.stops.push(id);
      },
      volume(volume, id) {
        if (volume !== undefined) calls.volumes.push({ volume, id: id ?? 0 });
        return fake;
      },
      rate(rate, id) {
        if (rate !== undefined) calls.rates.push({ rate, id: id ?? 0 });
        return fake;
      },
      stereo(pan, id) {
        if (pan !== undefined) calls.pans.push({ pan, id: id ?? 0 });
        return fake;
      },
      unload() {
        calls.unloads += 1;
      },
      state() {
        return 'loaded';
      },
      once() {
        return undefined;
      },
    };
    howls.set(def.id, fake);
    created.push(def.id);
    return fake;
  };

  return { howls, created, createHowl };
}

function setup(overrides: Partial<AudioDeps> = {}) {
  const fakes = createFakes();
  const storage = new MemoryStorage();
  let running = true;
  let clock = 0;

  const manager = createAudioManager({
    createHowl: fakes.createHowl,
    isRunning: () => running,
    now: () => clock,
    storage,
    ...overrides,
  });

  return {
    manager,
    fakes,
    storage,
    setRunning(value: boolean) {
      running = value;
    },
    advance(ms: number) {
      clock += ms;
    },
  };
}

function load(fakes: ReturnType<typeof createFakes>, id: SoundId): FakeHowl {
  const howl = fakes.howls.get(id);
  if (!howl) throw new Error(`missing fake howl ${id}`);
  howl.handlers.onload();
  return howl;
}

function latestVolume(
  howl: FakeHowl
): { volume: number; id: number } | undefined {
  return howl.calls.volumes[howl.calls.volumes.length - 1];
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  warn.mockRestore();
});

describe('AudioManager preload', () => {
  it('names exactly the 14 approved cues', () => {
    expect(SOUND_IDS).toHaveLength(14);
    expect(Object.keys(SOUND_MANIFEST)).toEqual([...SOUND_IDS]);
  });

  it('creates one Howl per manifest id exactly once', () => {
    const { manager, fakes } = setup();

    manager.preload();
    expect(fakes.created).toHaveLength(SOUND_IDS.length);
    expect(new Set(fakes.created).size).toBe(SOUND_IDS.length);

    manager.preload();
    expect(fakes.created).toHaveLength(SOUND_IDS.length);
    expect(manager.getSnapshot().loaded).toBe(0);
  });

  it('marks a throwing constructor as failed without breaking others', () => {
    const { manager } = setup({
      createHowl: () => {
        throw new Error('bad file');
      },
    });

    manager.preload(['ui_click', 'ui_confirm']);

    expect(manager.getSnapshot().failed).toBe(2);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(manager.getSnapshot().loaded).toBe(0);
  });
});

describe('AudioManager playback', () => {
  it('drops sounds until the audio context is running', () => {
    const { manager, fakes, setRunning } = setup();
    manager.preload(['ui_confirm']);
    const howl = load(fakes, 'ui_confirm');

    setRunning(false);
    expect(manager.play('ui_confirm')).toBeNull();
    expect(manager.getSnapshot().dropped).toBe(1);
    expect(howl.calls.played).toEqual([]);

    setRunning(true);
    const playbackId = manager.play('ui_confirm');

    expect(playbackId).toBe(1);
    expect(latestVolume(howl)?.volume).toBeCloseTo(0.576);
    expect(manager.getSnapshot().dropped).toBe(1);
  });

  it('refuses to play before the sound has loaded', () => {
    const { manager } = setup();
    manager.preload(['ui_confirm']);

    expect(manager.play('ui_confirm')).toBeNull();
    expect(manager.getSnapshot().dropped).toBe(0);
  });

  it('skips a failed sound and leaves the rest usable', () => {
    const { manager, fakes } = setup();
    manager.preload(['sword_hit', 'sword_swing']);

    const failed = fakes.howls.get('sword_hit');
    failed?.handlers.onloaderror(0, new Error('404'));
    failed?.handlers.onloaderror(0, new Error('404'));

    expect(manager.getSnapshot().failed).toBe(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('sword_hit');
    expect(manager.play('sword_hit')).toBeNull();

    load(fakes, 'sword_swing');
    expect(manager.play('sword_swing')).not.toBeNull();
  });

  it('blocks playback while muted or at zero master gain', () => {
    const { manager, fakes } = setup();
    manager.preload(['ui_confirm']);
    load(fakes, 'ui_confirm');

    manager.setMuted(true);
    expect(manager.play('ui_confirm')).toBeNull();

    manager.setMuted(false);
    expect(manager.play('ui_confirm')).not.toBeNull();
    manager.stopAll();

    manager.setVolume('master', 0);
    expect(manager.play('ui_confirm')).toBeNull();
  });

  it('clamps rate and pan for a playback', () => {
    const { manager, fakes } = setup();
    manager.preload(['ui_confirm']);
    const howl = load(fakes, 'ui_confirm');

    manager.play('ui_confirm', { rate: 99, pan: -5 });

    expect(howl.calls.rates[0]?.rate).toBe(2);
    expect(howl.calls.pans[0]?.pan).toBe(-1);
  });

  it('limits overlapping copies and frees a slot on end', () => {
    const { manager, fakes } = setup();
    manager.preload(['ui_confirm']);
    const howl = load(fakes, 'ui_confirm');

    const first = manager.play('ui_confirm');
    expect(first).not.toBeNull();
    expect(manager.play('ui_confirm')).toBeNull();

    howl.handlers.onend(first ?? -1);
    expect(manager.play('ui_confirm')).not.toBeNull();
  });
});

describe('AudioManager mixing', () => {
  it('re-applies a bus change to every live playback', () => {
    const { manager, fakes } = setup();
    manager.preload(['ui_confirm']);
    const howl = load(fakes, 'ui_confirm');

    manager.play('ui_confirm');
    expect(latestVolume(howl)?.volume).toBeCloseTo(0.576);

    manager.setVolume('ui', 0.5);
    expect(latestVolume(howl)?.volume).toBeCloseTo(0.36);

    manager.setVolume('master', 0.5);
    expect(latestVolume(howl)?.volume).toBeCloseTo(0.225);
  });

  it('notifies subscribers only on real changes and unsubscribes', () => {
    const { manager } = setup();
    let notifications = 0;
    const unsubscribe = manager.subscribe(() => {
      notifications += 1;
    });

    const initial = manager.getSnapshot();
    expect(manager.getSnapshot()).toBe(initial);

    manager.setVolume('sfx', 1);
    expect(notifications).toBe(0);

    manager.setVolume('sfx', 0.5);
    expect(notifications).toBe(1);
    expect(manager.getSnapshot()).not.toBe(initial);

    manager.setVolume('sfx', 0.5);
    expect(notifications).toBe(1);

    manager.setMuted(false);
    expect(notifications).toBe(1);
    manager.setMuted(true);
    expect(notifications).toBe(2);

    unsubscribe();
    manager.setMuted(false);
    expect(notifications).toBe(2);
  });

  it('persists mixer changes', () => {
    const { manager, storage } = setup();

    manager.setVolume('ambient', 0.2);
    manager.setMuted(true);

    const stored = storage.data.get('dungeon-dude:audio:v1');
    expect(stored).toBeDefined();
    expect(JSON.parse(stored ?? '{}')).toMatchObject({
      muted: true,
      volumes: { ambient: 0.2 },
    });
  });
});

describe('AudioManager teardown', () => {
  it('stops and unloads everything, and dispose is idempotent', () => {
    const { manager, fakes } = setup();
    manager.preload(['ui_click', 'ui_confirm']);
    const click = load(fakes, 'ui_click');
    const confirm = load(fakes, 'ui_confirm');

    manager.play('ui_click');
    manager.play('ui_confirm');
    manager.stopAll();
    expect(click.calls.stops).toHaveLength(1);
    expect(confirm.calls.stops).toHaveLength(1);

    manager.dispose();
    expect(click.calls.unloads).toBe(1);
    expect(confirm.calls.unloads).toBe(1);

    manager.dispose();
    expect(click.calls.unloads).toBe(1);
    expect(manager.play('ui_click')).toBeNull();
  });
});

describe('AudioManager snapshot', () => {
  it('counts loaded sounds and keeps the object stable otherwise', () => {
    const { manager, fakes } = setup();
    manager.preload(['ui_click', 'ui_confirm']);
    load(fakes, 'ui_click');
    const snapshot = manager.getSnapshot();

    expect(snapshot.loaded).toBe(1);
    expect(manager.getSnapshot()).toBe(snapshot);

    load(fakes, 'ui_confirm');
    expect(manager.getSnapshot().loaded).toBe(2);
    expect(manager.getSnapshot()).not.toBe(snapshot);
  });
});
