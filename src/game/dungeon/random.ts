/**
 * Deterministic pseudo-random source for dungeon generation. A seeded generator
 * lets us reproduce a layout from a depth number or a reported seed, which is
 * essential when a generated room or corridor behaves badly.
 */

import { DUNGEON_DEFAULT_SEED } from './constants';

export interface RandomSource {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [min, max], inclusive. */
  int: (min: number, max: number) => number;
  /** True with the given probability in [0, 1]. */
  chance: (probability: number) => boolean;
  /** Uniformly selects one item. The caller must pass a non-empty array. */
  pick: <T>(items: readonly T[]) => T;
}

/**
 * Mulberry32 is small, fast, and good enough for level layouts. It is not
 * cryptographic and does not need to be.
 */
export function createRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (probability) => next() < probability,
    pick: <T,>(items: readonly T[]) => {
      if (items.length === 0) throw new Error('Cannot pick from an empty array');
      return items[Math.floor(next() * items.length)];
    },
  };
}

/**
 * Turns a depth into a stable 32-bit seed. Depth one uses the approved default
 * seed so the first floor is reproducible by name; deeper floors are hashed.
 * The multipliers are arbitrary but spread adjacent depths far apart.
 */
export function seedForDepth(depth: number): number {
  if (depth <= 1) return DUNGEON_DEFAULT_SEED;
  return (Math.imul(depth, 2654435761) ^ 0x9e3779b9) >>> 0;
}
