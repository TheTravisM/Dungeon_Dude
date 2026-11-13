import type { DungeonWallCell } from '../../types';
import { createCellMask, mergeMaskRectangles, type GridRectangle } from '../dungeon/rectangles';

/**
 * Greedy-merges wall cells into the fewest two-dimensional rectangles. Collision
 * uses these rectangles instead of one rigid body per wall tile. Each cell is
 * covered by exactly one rectangle, so the merged walls stay gap-free while the
 * Rapier broad phase sees a handful of cuboids.
 */
export function mergeWallColliders(
  wallCells: readonly DungeonWallCell[],
  size: number
): GridRectangle[] {
  const mask = createCellMask(wallCells, size);
  return mergeMaskRectangles(mask, size, [1]);
}
