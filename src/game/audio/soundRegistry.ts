import {
  SOUND_IDS,
  SOUND_MANIFEST,
  type SoundDef,
  type SoundId,
} from './manifest';
import type { HowlHandlers, HowlLike } from './types';

export interface SoundRegistryEvents {
  /** Load counts changed; the manager refreshes its snapshot. */
  changed: () => void;
  failed: (id: SoundId) => void;
  ended: (id: SoundId, playbackId: number) => void;
}

export interface SoundRegistry {
  preload(ids?: readonly SoundId[]): void;
  howl(id: SoundId): HowlLike | undefined;
  isLoaded(id: SoundId): boolean;
  hasFailed(id: SoundId): boolean;
  soundIds(): readonly SoundId[];
  loadedCount(): number;
  failedCount(): number;
  dispose(): void;
}

/**
 * Owns Howl instances and their load state. No Howler import lives here: the
 * manager injects `createHowl`, which keeps this module fake-friendly.
 */
export function createSoundRegistry(
  createHowl: (
    def: SoundDef & { id: SoundId },
    handlers: HowlHandlers
  ) => HowlLike,
  events: SoundRegistryEvents
): SoundRegistry {
  const howls = new Map<SoundId, HowlLike>();
  const loaded = new Set<SoundId>();
  const failed = new Set<SoundId>();
  let loadedTotal = 0;
  let failedTotal = 0;

  function markFailed(id: SoundId): void {
    if (failed.has(id)) return;
    failed.add(id);
    loaded.delete(id);
    failedTotal += 1;
    events.failed(id);
    events.changed();
  }

  function handlersFor(id: SoundId): HowlHandlers {
    return {
      onload: () => {
        if (loaded.has(id) || failed.has(id)) return;
        loaded.add(id);
        loadedTotal += 1;
        events.changed();
      },
      onloaderror: () => markFailed(id),
      onend: (playbackId) => events.ended(id, playbackId),
      onstop: (playbackId) => events.ended(id, playbackId),
    };
  }

  return {
    preload(ids = SOUND_IDS) {
      for (const id of ids) {
        if (howls.has(id) || failed.has(id)) continue;
        try {
          howls.set(
            id,
            createHowl({ ...SOUND_MANIFEST[id], id }, handlersFor(id))
          );
        } catch {
          markFailed(id);
        }
      }
    },

    howl(id) {
      return howls.get(id);
    },

    isLoaded(id) {
      return loaded.has(id);
    },

    hasFailed(id) {
      return failed.has(id);
    },

    soundIds() {
      return [...howls.keys()];
    },

    loadedCount() {
      return loadedTotal;
    },

    failedCount() {
      return failedTotal;
    },

    dispose() {
      for (const howl of howls.values()) {
        try {
          howl.stop();
        } catch {
          // An already unloaded Howl is silent.
        }
        try {
          howl.unload();
        } catch {
          // Unloading is best effort during teardown.
        }
      }
      howls.clear();
      loaded.clear();
      failed.clear();
    },
  };
}
