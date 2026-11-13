import type { Bus } from './buses';

export type SoundId =
  | 'sword_swing'
  | 'sword_hit'
  | 'monster_windup'
  | 'monster_strike'
  | 'hero_hurt'
  | 'monster_death'
  | 'hero_death'
  | 'footstep'
  | 'key_pickup'
  | 'stairs_descend'
  | 'ui_click'
  | 'ui_confirm'
  | 'game_over'
  | 'ambient_dungeon';

export interface SoundDef {
  /** Absolute URL under the Vite base, e.g. `/assets/audio/sfx/sword_hit.wav`. */
  readonly src: string;
  readonly bus: Bus;
  /** Per-sound trim in 0..1, applied on top of the bus. */
  readonly volume: number;
  readonly maxVoices: number;
  readonly minIntervalMs: number;
  readonly loop?: boolean;
}

const SFX_ROOT = `${import.meta.env.BASE_URL}assets/audio/sfx/`;
const AMBIENT_ROOT = `${import.meta.env.BASE_URL}assets/audio/ambient/`;
function sfx(
  id: SoundId,
  bus: Bus,
  volume: number,
  maxVoices: number,
  minIntervalMs: number
): SoundDef {
  return Object.freeze({
    src: `${SFX_ROOT}${id}.wav`,
    bus,
    volume,
    maxVoices,
    minIntervalMs,
  });
}

/** One entry per cue; generated WAV files arrive in 08-02. */
export const SOUND_MANIFEST: Readonly<Record<SoundId, SoundDef>> = Object.freeze(
  {
    sword_swing: sfx('sword_swing', 'sfx', 0.7, 2, 120),
    sword_hit: sfx('sword_hit', 'sfx', 1, 3, 60),
    monster_windup: sfx('monster_windup', 'sfx', 0.6, 3, 150),
    monster_strike: sfx('monster_strike', 'sfx', 0.9, 3, 100),
    hero_hurt: sfx('hero_hurt', 'sfx', 1, 1, 250),
    monster_death: sfx('monster_death', 'sfx', 1, 3, 80),
    hero_death: sfx('hero_death', 'sfx', 1, 1, 0),
    footstep: sfx('footstep', 'sfx', 0.35, 2, 200),
    key_pickup: sfx('key_pickup', 'sfx', 1, 1, 0),
    stairs_descend: sfx('stairs_descend', 'sfx', 1, 1, 0),
    ui_click: sfx('ui_click', 'ui', 0.7, 2, 40),
    ui_confirm: sfx('ui_confirm', 'ui', 0.9, 1, 0),
    game_over: sfx('game_over', 'ui', 1, 1, 0),
    ambient_dungeon: Object.freeze({
      src: `${AMBIENT_ROOT}ambient_dungeon.wav`,
      bus: 'ambient',
      volume: 0.5,
      maxVoices: 1,
      minIntervalMs: 0,
      loop: true,
    }),
  }
);
export const SOUND_IDS: readonly SoundId[] = Object.freeze([
  'sword_swing',
  'sword_hit',
  'monster_windup',
  'monster_strike',
  'hero_hurt',
  'monster_death',
  'hero_death',
  'footstep',
  'key_pickup',
  'stairs_descend',
  'ui_click',
  'ui_confirm',
  'game_over',
  'ambient_dungeon',
]);
