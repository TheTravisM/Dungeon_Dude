import type { MonsterArchetypeId } from '../../types';

export interface MonsterPart {
  readonly pos: readonly [number, number, number]; // part center, feet at y = 0
  readonly size: readonly [number, number, number];
  readonly color: string;
  readonly emissive?: string; // faint glow, e.g. eyes
}

const SLIME: readonly MonsterPart[] = Object.freeze([
  { pos: [0, 0.18, 0], size: [0.56, 0.36, 0.56], color: '#4f8a3c' },
  { pos: [0, 0.46, 0], size: [0.4, 0.2, 0.4], color: '#7bb35a' },
  { pos: [-0.12, 0.24, 0.28], size: [0.07, 0.07, 0.07], color: '#101810', emissive: '#223322' },
  { pos: [0.12, 0.24, 0.28], size: [0.07, 0.07, 0.07], color: '#101810', emissive: '#223322' },
]);

const SKELETON: readonly MonsterPart[] = Object.freeze([
  { pos: [-0.08, 0.15, 0], size: [0.08, 0.3, 0.1], color: '#c9c3ad' },
  { pos: [0.08, 0.15, 0], size: [0.08, 0.3, 0.1], color: '#c9c3ad' },
  { pos: [0, 0.52, 0], size: [0.28, 0.28, 0.18], color: '#d8d2bd' },
  { pos: [0, 0.64, 0], size: [0.38, 0.06, 0.16], color: '#b8b29c' },
  { pos: [0, 0.78, 0], size: [0.22, 0.22, 0.22], color: '#e2dcc7' },
  { pos: [-0.06, 0.79, 0.11], size: [0.05, 0.05, 0.02], color: '#1a1410', emissive: '#6a2a10' },
  { pos: [0.06, 0.79, 0.11], size: [0.05, 0.05, 0.02], color: '#1a1410', emissive: '#6a2a10' },
  { pos: [-0.2, 0.52, 0], size: [0.06, 0.26, 0.08], color: '#c9c3ad' },
  { pos: [0.2, 0.52, 0], size: [0.06, 0.26, 0.08], color: '#c9c3ad' },
  { pos: [0.26, 0.5, 0.06], size: [0.05, 0.4, 0.05], color: '#7a5a3a' },
]);

const BAT: readonly MonsterPart[] = Object.freeze([
  { pos: [0, 0.3, 0], size: [0.18, 0.18, 0.16], color: '#3b2f4a' },
  { pos: [0, 0.42, 0.02], size: [0.14, 0.13, 0.14], color: '#2f253c' },
  { pos: [-0.035, 0.44, 0.09], size: [0.04, 0.04, 0.02], color: '#aa2222', emissive: '#aa2222' },
  { pos: [0.035, 0.44, 0.09], size: [0.04, 0.04, 0.02], color: '#aa2222', emissive: '#aa2222' },
  { pos: [-0.18, 0.32, 0], size: [0.24, 0.06, 0.18], color: '#2a2038' },
  { pos: [0.18, 0.32, 0], size: [0.24, 0.06, 0.18], color: '#2a2038' },
]);

export const MONSTER_PARTS: Readonly<
  Record<MonsterArchetypeId, readonly MonsterPart[]>
> = Object.freeze({
  slime: SLIME,
  skeleton: SKELETON,
  bat: BAT,
});
