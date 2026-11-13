export type Bus = 'sfx' | 'ambient' | 'voice' | 'ui';
export type MixerKey = 'master' | Bus;

export interface MixerState {
  volumes: Record<MixerKey, number>;
  muted: boolean;
}

/** Default mix. Volumes are normalized gains, not decibels. */
export const DEFAULT_MIXER: Readonly<MixerState> = Object.freeze({
  volumes: Object.freeze({
    master: 0.8,
    sfx: 1,
    ambient: 0.5,
    voice: 1,
    ui: 0.8,
  }),
  muted: false,
});

/** Normalizes a gain, treating NaN and infinities as silence. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Final gain for a bus: master times the bus trim, or zero when muted. */
export function busGain(mixer: MixerState, bus: Bus): number {
  if (mixer.muted) return 0;
  return clamp01(mixer.volumes.master) * clamp01(mixer.volumes[bus]);
}

/** Bus gain combined with the per-sound and per-playback trims. */
export function soundGain(
  mixer: MixerState,
  bus: Bus,
  soundVolume: number
): number {
  return busGain(mixer, bus) * clamp01(soundVolume);
}
