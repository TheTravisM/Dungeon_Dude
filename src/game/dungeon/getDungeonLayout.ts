import type { DungeonLayout } from '../../types';
import { generateDungeon } from './generateDungeon';
import { seedForDepth } from './random';

const cache = new Map<number, DungeonLayout>();

const configuredSeed = Number(import.meta.env.VITE_DUNGEON_SEED);
const overrideSeed =
  Number.isFinite(configuredSeed) && configuredSeed > 0
    ? Math.floor(configuredSeed)
    : null;

/**
 * A configured seed wins over the depth seed so a reported layout can be
 * reproduced exactly. Otherwise depth alone determines the dungeon.
 */
export function resolveDungeonSeed(depth: number): number {
  return overrideSeed ?? seedForDepth(depth);
}

/**
 * Layouts are cached by seed. Re-renders, React strict mode, and the debug
 * panel all request the same layout without regenerating it.
 */
export function getDungeonLayout(depth: number): DungeonLayout {
  const seed = resolveDungeonSeed(depth);
  const cached = cache.get(seed);
  if (cached) return cached;

  const layout = generateDungeon(seed);
  cache.set(seed, layout);
  return layout;
}
