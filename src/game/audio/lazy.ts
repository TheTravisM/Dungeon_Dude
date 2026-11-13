import type { AudioManager } from './types';

/**
 * Defers creating the real manager until the first method call. The facade's
 * method identities are stable, which is what `useSyncExternalStore` needs.
 */
export function createLazyAudio(factory: () => AudioManager): AudioManager {
  let instance: AudioManager | null = null;

  function get(): AudioManager {
    if (!instance) {
      instance = factory();
      import.meta.hot?.dispose(() => {
        instance?.dispose();
        instance = null;
      });
    }
    return instance;
  }

  return {
    preload: (ids) => get().preload(ids),
    play: (id, opts) => get().play(id, opts),
    stop: (id, playbackId) => get().stop(id, playbackId),
    stopAll: () => get().stopAll(),
    setVolume: (key, value) => get().setVolume(key, value),
    setMuted: (muted) => get().setMuted(muted),
    getSnapshot: () => get().getSnapshot(),
    subscribe: (listener) => get().subscribe(listener),
    dispose: () => {
      instance?.dispose();
      instance = null;
    },
  };
}
