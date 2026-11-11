import { worldToGrid } from '../../dungeon/constants';
import { HERO_PATH_CLEARANCE } from '../constants';
import type { WorldPoint } from './heroPath';
import type { WalkGrid } from './walkGrid';

/** Distance between line-of-sight samples, in world units. */
const SAMPLE_STEP = 0.1;

function isWalkableAt(
  grid: WalkGrid,
  x: number,
  z: number,
  clearance: number
): boolean {
  if (!grid.isWalkable(worldToGrid(x, grid.size), worldToGrid(z, grid.size))) {
    return false;
  }
  if (!grid.isWalkable(worldToGrid(x + clearance, grid.size), worldToGrid(z, grid.size))) {
    return false;
  }
  if (!grid.isWalkable(worldToGrid(x - clearance, grid.size), worldToGrid(z, grid.size))) {
    return false;
  }
  if (!grid.isWalkable(worldToGrid(x, grid.size), worldToGrid(z + clearance, grid.size))) {
    return false;
  }
  return grid.isWalkable(worldToGrid(x, grid.size), worldToGrid(z - clearance, grid.size));
}

/**
 * True when the straight segment from `a` to `b` stays inside walkable cells,
 * including the four clearance offsets around every sample point. Sampling at
 * 0.1 units cannot skip a wall between two points.
 */
export function hasClearLine(
  grid: WalkGrid,
  a: WorldPoint,
  b: WorldPoint,
  clearance: number
): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / SAMPLE_STEP));

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    if (!isWalkableAt(grid, a.x + dx * t, a.z + dz * t, clearance)) {
      return false;
    }
  }
  return true;
}

/**
 * String-pulling smoother. From the current anchor it takes the farthest
 * later point with a clear line, so a cell-by-cell route collapses into a few
 * straight legs without cutting corners. The start point is never returned;
 * the final point is always the original goal.
 */
export function smoothPath(
  grid: WalkGrid,
  start: WorldPoint,
  points: WorldPoint[],
  clearance: number = HERO_PATH_CLEARANCE
): WorldPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0]];

  const smoothed: WorldPoint[] = [];
  let anchor = start;
  let current = 0;

  while (current < points.length - 1) {
    let next = current + 1;
    for (let probe = points.length - 1; probe > current; probe--) {
      if (hasClearLine(grid, anchor, points[probe], clearance)) {
        next = probe;
        break;
      }
    }

    anchor = points[next];
    smoothed.push(anchor);
    current = next;
  }

  return smoothed;
}
