import type { DungeonLayout } from '../../types';
import {
  FLOOR_TOP,
  FLOOR_TILE_HEIGHT,
  FLOOR_TILE_INSET,
  gridToWorld,
} from './constants';

/**
 * Matrix elements per instance. Three stores instance matrices column-major in
 * a flat Float32Array, which lets the renderer copy data without allocating
 * objects per tile.
 */
export const FLOOR_INSTANCE_STRIDE = 16;

const cache = new Map<string, Float32Array>();

/** The size is part of the key so a different grid size cannot reuse a layout. */
function cacheKey(layout: DungeonLayout): string {
  return `${layout.seed}:${layout.size}`;
}

/**
 * Builds one transform per floor cell for a shared box geometry. Matrices are
 * produced once per generated layout and cached outside React so re-renders and
 * strict mode cannot rebuild them. Tile tops align with `FLOOR_TOP`, while their
 * bottoms meet the plinth top at y = 0.
 */
export function getFloorInstanceMatrices(layout: DungeonLayout): Float32Array {
  const key = cacheKey(layout);
  const cached = cache.get(key);
  if (cached) return cached;

  const scale = 1 - FLOOR_TILE_INSET * 2;
  const centerY = FLOOR_TOP - FLOOR_TILE_HEIGHT / 2;
  const matrices = new Float32Array(layout.floorCells.length * FLOOR_INSTANCE_STRIDE);

  for (let index = 0; index < layout.floorCells.length; index++) {
    const cell = layout.floorCells[index];
    const offset = index * FLOOR_INSTANCE_STRIDE;

    // Identity rotation, inset horizontal scale, and unit vertical scale.
    matrices[offset] = scale;
    matrices[offset + 5] = 1;
    matrices[offset + 10] = scale;
    matrices[offset + 12] = gridToWorld(cell.x, layout.size);
    matrices[offset + 13] = centerY;
    matrices[offset + 14] = gridToWorld(cell.z, layout.size);
    matrices[offset + 15] = 1;
  }

  cache.set(key, matrices);
  return matrices;
}
