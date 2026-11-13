import type { DungeonLayout } from '../../types';
import { buildFloorMatrices, MATRIX_STRIDE } from '../instancing/buildTileMatrices';

/**
 * Matrix elements per instance. Three stores instance matrices column-major in
 * a flat Float32Array, which lets the renderer copy data without allocating
 * objects per tile.
 */
export const FLOOR_INSTANCE_STRIDE = MATRIX_STRIDE;

const cache = new Map<string, Float32Array>();

/** The size is part of the key so a different grid size cannot reuse a layout. */
function cacheKey(layout: DungeonLayout): string {
  return `${layout.seed}:${layout.size}`;
}

/**
 * Produces one transform per floor cell and caches it outside React so
 * re-renders and strict mode cannot rebuild it. The pure builder owns the
 * seeded jitter; this module only memoizes the result per layout.
 */
export function getFloorInstanceMatrices(layout: DungeonLayout): Float32Array {
  const key = cacheKey(layout);
  const cached = cache.get(key);
  if (cached) return cached;

  const matrices = buildFloorMatrices(layout);
  cache.set(key, matrices);
  return matrices;
}
