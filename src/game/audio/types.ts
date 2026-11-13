import type { MixerKey, MixerState } from './buses';
import type { SoundDef, SoundId } from './manifest';
import type { PrefsStorage } from './prefs';

export interface PlayOptions {
  volume?: number;
  rate?: number;
  /** Stereo pan in -1..1. */
  pan?: number;
}

export interface AudioSnapshot {
  mixer: MixerState;
  loaded: number;
  failed: number;
  dropped: number;
}

export interface HowlHandlers {
  onload: () => void;
  onloaderror: (id: number, error: unknown) => void;
  onend: (id: number) => void;
  onstop: (id: number) => void;
}

/** The small Howler surface the manager needs; tests inject a fake. */
export interface HowlLike {
  play(): number;
  stop(id?: number): void;
  volume(volume?: number, id?: number): unknown;
  rate(rate?: number, id?: number): unknown;
  stereo(pan?: number, id?: number): unknown;
  unload(): void;
  state(): string;
  once(event: string, fn: (...args: unknown[]) => void): void;
}

export interface AudioDeps {
  createHowl: (
    def: SoundDef & { id: SoundId },
    handlers: HowlHandlers
  ) => HowlLike;
  isRunning: () => boolean;
  now: () => number;
  storage: PrefsStorage | null;
}

export interface AudioManager {
  preload(ids?: readonly SoundId[]): void;
  play(id: SoundId, opts?: PlayOptions): number | null;
  stop(id: SoundId, playbackId?: number): void;
  stopAll(): void;
  setVolume(key: MixerKey, value: number): void;
  setMuted(muted: boolean): void;
  getSnapshot(): AudioSnapshot;
  subscribe(listener: () => void): () => void;
  dispose(): void;
}
