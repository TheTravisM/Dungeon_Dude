import type { DungeonLayout, GridCell } from '../../../types';
import { gridToWorld, worldToGrid } from '../../dungeon/constants';
import { findGridPath } from '../../dungeon/pathfinding';
import { createWalkGrid, type WalkGrid } from './walkGrid';

/** A point on the horizontal world plane. Y is supplied by the caller. */
export interface WorldPoint {
  x: number;
  z: number;
}

/**
 * Plans a cardinal route between two grid cells. The returned path excludes
 * the start cell and includes the goal; `[]` means the start already is the
 * goal. An unwalkable start or goal returns `null` rather than snapping.
 */
export function planGridPath(
  grid: WalkGrid,
  from: GridCell,
  to: GridCell
): GridCell[] | null {
  if (!grid.isWalkable(from.x, from.z) || !grid.isWalkable(to.x, to.z)) {
    return null;
  }
  if (from.x === to.x && from.z === to.z) return [];

  const path = findGridPath({
    size: grid.size,
    start: from,
    goal: to,
    canEnter: grid.isWalkable,
  });
  if (!path) return null;

  // findGridPath includes the start cell; callers want only the steps to take.
  return path.slice(1);
}

/**
 * Plans a route between two world positions on a generated layout, returning
 * cell-center world points with the same start-excluded shape as
 * `planGridPath`.
 */
export function planWorldPath(
  layout: DungeonLayout,
  from: WorldPoint,
  to: WorldPoint
): WorldPoint[] | null {
  const grid = createWalkGrid(layout);
  const start: GridCell = {
    x: worldToGrid(from.x, layout.size),
    z: worldToGrid(from.z, layout.size),
  };
  const goal: GridCell = {
    x: worldToGrid(to.x, layout.size),
    z: worldToGrid(to.z, layout.size),
  };

  const path = planGridPath(grid, start, goal);
  if (!path) return null;

  return path.map((cell) => ({
    x: gridToWorld(cell.x, layout.size),
    z: gridToWorld(cell.z, layout.size),
  }));
}
