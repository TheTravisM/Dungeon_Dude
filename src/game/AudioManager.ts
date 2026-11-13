import {
  clamp01,
  soundGain,
  type MixerKey,
  type MixerState,
} from './audio/buses';
import { loadMixer, saveMixer } from './audio/prefs';
import { createVoiceLimiter } from './audio/voiceLimiter';
import { SOUND_MANIFEST, type SoundId } from './audio/manifest';
import { createSoundRegistry } from './audio/soundRegistry';
import { createPlaybackRegistry } from './audio/playback';
import {
  defaultCreateHowl,
  defaultIsRunning,
  defaultStorage,
} from './audio/howlerDefaults';
import { createLazyAudio } from './audio/lazy';
import type {
  AudioDeps,
  AudioManager,
  AudioSnapshot,
  PlayOptions,
} from './audio/types';

function clampRange(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
/**
 * Framework-free owner of every Howler instance. Game code plays cues by id;
 * React only reads the snapshot through `useSyncExternalStore`.
 */
export function createAudioManager(
  deps: Partial<AudioDeps> = {}
): AudioManager {
  const createHowl = deps.createHowl ?? defaultCreateHowl;
  const isRunning = deps.isRunning ?? defaultIsRunning;
  const now = deps.now ?? (() => performance.now());
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  let mixer = loadMixer(storage);
  let disposed = false;
  let dropped = 0;
  const listeners = new Set<() => void>();
  const limiter = createVoiceLimiter();
  const playbacks = createPlaybackRegistry(limiter);

  let snapshot: AudioSnapshot = {
    mixer,
    loaded: 0,
    failed: 0,
    dropped: 0,
  };
  let ready = false;

  const registry = createSoundRegistry(createHowl, {
    changed: () => refresh(),
    failed: (id) => {
      if (import.meta.env.DEV) {
        console.warn(
          `[audio] could not load ${SOUND_MANIFEST[id].src} (${id})`
        );
      }
    },
    ended: (id, playbackId) => playbacks.release(id, playbackId),
  });
  ready = true;
  refresh();

  function refresh(): void {
    if (!ready) return;
    snapshot = {
      mixer,
      loaded: registry.loadedCount(),
      failed: registry.failedCount(),
      dropped,
    };
    for (const listener of [...listeners]) listener();
  }

  function commitMixer(next: MixerState): void {
    mixer = next;
    saveMixer(storage, mixer);
    playbacks.applyVolumes(mixer, (id) => registry.howl(id));
    refresh();
  }

  function play(id: SoundId, opts: PlayOptions = {}): number | null {
    if (disposed || registry.hasFailed(id) || !registry.isLoaded(id)) {
      return null;
    }
    const howl = registry.howl(id);
    if (!howl) return null;

    if (!isRunning()) {
      dropped += 1;
      refresh();
      return null;
    }
    if (mixer.muted) return null;

    const def = SOUND_MANIFEST[id];
    const trim = def.volume * (opts.volume ?? 1);
    const gain = soundGain(mixer, def.bus, trim);
    if (gain <= 0) return null;
    if (!limiter.tryAcquire(id, now(), def)) return null;

    let playbackId: number;
    try {
      playbackId = howl.play();
    } catch {
      limiter.release(id);
      return null;
    }
    if (!Number.isFinite(playbackId)) {
      limiter.release(id);
      return null;
    }

    playbacks.add(id, playbackId, trim);
    howl.volume(gain, playbackId);
    howl.rate(clampRange(opts.rate, 1, 0.5, 2), playbackId);
    howl.stereo(clampRange(opts.pan, 0, -1, 1), playbackId);
    return playbackId;
  }

  function stop(id: SoundId, playbackId?: number): void {
    const howl = registry.howl(id);
    if (!howl) return;

    if (playbackId === undefined) {
      playbacks.releaseAll(id);
      howl.stop();
      return;
    }

    playbacks.release(id, playbackId);
    howl.stop(playbackId);
  }

  function stopAll(): void {
    for (const id of registry.soundIds()) stop(id);
  }

  function setVolume(key: MixerKey, value: number): void {
    const next = clamp01(value);
    if (mixer.volumes[key] === next) return;
    commitMixer({
      volumes: { ...mixer.volumes, [key]: next },
      muted: mixer.muted,
    });
  }

  function setMuted(muted: boolean): void {
    if (mixer.muted === muted) return;
    commitMixer({ volumes: { ...mixer.volumes }, muted });
  }

  function getSnapshot(): AudioSnapshot {
    return snapshot;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    playbacks.clear();
    limiter.reset();
    listeners.clear();
    registry.dispose();
  }

  return {
    preload: (ids) => {
      if (!disposed) registry.preload(ids);
    },
    play,
    stop,
    stopAll,
    setVolume,
    setMuted,
    getSnapshot,
    subscribe,
    dispose,
  };
}

/** Lazy process-wide manager with stable method identities for React. */
export const audio: AudioManager = createLazyAudio(() => createAudioManager());
