import { soundGain, type MixerState } from './buses';
import { SOUND_MANIFEST, type SoundId } from './manifest';
import type { HowlLike } from './types';
import type { VoiceLimiter } from './voiceLimiter';

export interface PlaybackRegistry {
  add(id: SoundId, playbackId: number, trim: number): void;
  release(id: SoundId, playbackId: number): void;
  releaseAll(id: SoundId): void;
  /** Re-applies the current mix to every live playback. */
  applyVolumes(
    mixer: MixerState,
    howlFor: (id: SoundId) => HowlLike | undefined
  ): void;
  clear(): void;
}

/**
 * Tracks one entry per live Howler playback so volume changes can reach a
 * running loop and every voice is released exactly once.
 */
export function createPlaybackRegistry(
  limiter: VoiceLimiter
): PlaybackRegistry {
  const active = new Map<SoundId, Map<number, number>>();

  return {
    add(id, playbackId, trim) {
      const playbacks = active.get(id) ?? new Map<number, number>();
      playbacks.set(playbackId, trim);
      active.set(id, playbacks);
    },

    release(id, playbackId) {
      const playbacks = active.get(id);
      if (!playbacks?.delete(playbackId)) return;
      if (playbacks.size === 0) active.delete(id);
      limiter.release(id);
    },

    releaseAll(id) {
      const playbacks = active.get(id);
      if (!playbacks) return;
      active.delete(id);
      for (let index = 0; index < playbacks.size; index += 1) {
        limiter.release(id);
      }
    },

    applyVolumes(mixer, howlFor) {
      for (const [id, playbacks] of active) {
        const howl = howlFor(id);
        if (!howl) continue;
        const bus = SOUND_MANIFEST[id].bus;
        for (const [playbackId, trim] of playbacks) {
          howl.volume(soundGain(mixer, bus, trim), playbackId);
        }
      }
    },

    clear() {
      active.clear();
    },
  };
}
