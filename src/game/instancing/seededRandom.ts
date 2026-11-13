/**
 * Deterministic per-cell randomness for environment instancing. Math.random()
 * would make a dungeon change every reload and break HMR reproducibility, so
 * every tile derives its jitter from the layout seed plus its grid coordinate.
 */

/** Mixes two grid coordinates and a seed into a stable 32-bit value. */
export function hashCell(x: number, z: number, seed: number): number {
  let hash = (seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** Small Mulberry32 PRNG. Good enough for visual variation, not cryptography. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a generator for one cell. The same cell always gets the same stream. */
export function createCellRandom(x: number, z: number, seed: number): () => number {
  return createSeededRandom(hashCell(x, z, seed));
}

/** Uniform value in [min, max]. */
export function range(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}
