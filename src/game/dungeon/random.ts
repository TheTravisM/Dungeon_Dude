/**
 * Deterministic pseudo-random source for dungeon generation. A seeded generator
 * lets us reproduce a layout from a depth number or a reported seed, which is
 * essential when a generated room or corridor behaves badly.
 */

export interface RandomSource {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [min, max], inclusive. */
  int: (min: number, max: number) => number;
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
  };
}

/**
 * Turns a depth into a stable 32-bit seed. The multipliers are arbitrary but
 * chosen to spread adjacent depth values far apart in the generator space.
 */
export function seedForDepth(depth: number): number {
  return (Math.imul(depth, 2654435761) ^ 0x9e3779b9) >>> 0;
}
