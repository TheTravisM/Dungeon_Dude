import { Howl, Howler } from 'howler';
import type { SoundDef, SoundId } from './manifest';
import type { PrefsStorage } from './prefs';
import type { HowlHandlers, HowlLike } from './types';

/** Production adapter; every direct Howler call stays behind this boundary. */
export function defaultCreateHowl(
  def: SoundDef & { id: SoundId },
  handlers: HowlHandlers
): HowlLike {
  return new Howl({
    src: [def.src],
    loop: def.loop ?? false,
    preload: true,
    html5: false,
    onload: handlers.onload,
    onloaderror: (id, error) => handlers.onloaderror(id, error),
    onend: handlers.onend,
    onstop: handlers.onstop,
  }) as unknown as HowlLike;
}

/** Autoplay policy check: only a running AudioContext may start a sound. */
export function defaultIsRunning(): boolean {
  return Howler.ctx?.state === 'running';
}

/** localStorage can throw in private or blocked contexts. */
export function defaultStorage(): PrefsStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
