import type { DungeonLayout } from '../../../types';
import { createCellMask } from '../../dungeon/rectangles';

/** Read-only navigation view of a generated dungeon floor. */
export interface WalkGrid {
  size: number;
  isWalkable(x: number, z: number): boolean;
}

const cache = new Map<string, WalkGrid>();

/** Size is part of the key so a different grid cannot reuse a mask. */
function cacheKey(layout: DungeonLayout): string {
  return `${layout.seed}:${layout.size}`;
}

/**
 * Builds a row-major walkability mask once per generated layout. The mask is
 * cached by seed and size because the AI repaths often while the floor never
 * changes. Out-of-bounds cells are never walkable.
 */
export function createWalkGrid(layout: DungeonLayout): WalkGrid {
  const key = cacheKey(layout);
  const cached = cache.get(key);
  if (cached) return cached;

  const mask = createCellMask(layout.floorCells, layout.size);
  const size = layout.size;

  const grid: WalkGrid = {
    size,
    isWalkable(x, z) {
      if (x < 0 || z < 0 || x >= size || z >= size) return false;
      return mask[z * size + x] === 1;
    },
  };

  cache.set(key, grid);
  return grid;
}
