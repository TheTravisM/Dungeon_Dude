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
 * A configured seed wins over the run seed so a reported layout can be
 * reproduced exactly. Otherwise depth one uses the run seed and deeper floors
 * derive a stable child seed from it: one run feels connected, while a reload
 * or restart produces a completely new dungeon.
 */
export function resolveDungeonSeed(depth: number, runSeed?: number): number {
  if (overrideSeed !== null) return overrideSeed;
  if (runSeed === undefined) return seedForDepth(depth);
  if (depth <= 1) return runSeed >>> 0 || 1;

  return (
    (Math.imul(runSeed ^ depth, 2654435761) ^ Math.imul(depth, 0x9e3779b9)) >>> 0
  );
}

/**
 * Layouts are cached by seed. Re-renders, React strict mode, and the debug
 * panel all request the same layout without regenerating it.
 */
export function getDungeonLayout(depth: number, runSeed?: number): DungeonLayout {
  const seed = resolveDungeonSeed(depth, runSeed);
  const cached = cache.get(seed);
  if (cached) return cached;

  const layout = generateDungeon(seed);
  cache.set(seed, layout);
  return layout;
}
