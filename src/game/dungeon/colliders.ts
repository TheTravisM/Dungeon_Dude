import type { DungeonLayout } from '../../types';
import {
  FLOOR_COLLIDER_THICKNESS,
  FLOOR_TOP,
  PLINTH_HEIGHT,
  PLINTH_SIZE,
  WALL_HEIGHT_TALL,
  gridToWorld,
} from './constants';
import {
  createCellMask,
  mergeMaskRectangles,
  type GridRectangle,
} from './rectangles';

export interface CuboidColliderSpec {
  halfExtents: [number, number, number];
  position: [number, number, number];
}

export interface DungeonColliderSpecs {
  /** Merged floor rectangles, kept as grid data so verification can check coverage. */
  floorRects: GridRectangle[];
  floorColliders: CuboidColliderSpec[];
  wallColliders: CuboidColliderSpec[];
  plinthCollider: CuboidColliderSpec;
}

const cache = new Map<string, DungeonColliderSpecs>();

function cacheKey(layout: DungeonLayout): string {
  return `${layout.seed}:${layout.size}`;
}

/**
 * Converts a layout into plain cuboid descriptions. The React collider component
 * only maps these to Rapier colliders, so collision geometry can be verified
 * without a browser or physics world. Floor cells merge into rectangles to keep
 * the collider count low; walls already arrive as merged runs.
 *
 * Wall colliders intentionally stay at the tall height even when the visible
 * ledge is low. The cutaway exists so the camera can see into the dungeon, not
 * so the hero can walk over a boundary.
 */
export function getDungeonColliderSpecs(layout: DungeonLayout): DungeonColliderSpecs {
  const key = cacheKey(layout);
  const cached = cache.get(key);
  if (cached) return cached;

  const floorMask = createCellMask(layout.floorCells, layout.size);
  const floorRects = mergeMaskRectangles(floorMask, layout.size, [1]);
  const floorThickness = FLOOR_COLLIDER_THICKNESS;

  const floorColliders = floorRects.map<CuboidColliderSpec>((rect) => ({
    halfExtents: [rect.width / 2, floorThickness / 2, rect.depth / 2],
    position: [
      gridToWorld(rect.x + (rect.width - 1) / 2, layout.size),
      FLOOR_TOP - floorThickness / 2,
      gridToWorld(rect.z + (rect.depth - 1) / 2, layout.size),
    ],
  }));

  const wallColliders = layout.wallRuns.map<CuboidColliderSpec>((run) => ({
    halfExtents: [run.width / 2, WALL_HEIGHT_TALL / 2, run.depth / 2],
    position: [
      gridToWorld(run.x + (run.width - 1) / 2, layout.size),
      WALL_HEIGHT_TALL / 2,
      gridToWorld(run.z + (run.depth - 1) / 2, layout.size),
    ],
  }));

  const plinthCollider: CuboidColliderSpec = {
    halfExtents: [PLINTH_SIZE / 2, PLINTH_HEIGHT / 2, PLINTH_SIZE / 2],
    position: [0, -PLINTH_HEIGHT / 2, 0],
  };

  const specs = { floorRects, floorColliders, wallColliders, plinthCollider };
  cache.set(key, specs);
  return specs;
}
