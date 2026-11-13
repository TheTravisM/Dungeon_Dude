import type { DungeonLayout } from '../../types';
import {
  buildWallMatrices,
  type WallMatrixData,
} from '../instancing/buildTileMatrices';

export type WallInstanceData = WallMatrixData;

const cache = new Map<string, WallInstanceData>();

function cacheKey(layout: DungeonLayout): string {
  return `${layout.seed}:${layout.size}`;
}

/**
 * Produces one transform per wall cell, split by cutaway height, and caches the
 * result per layout. Each batch uses a fixed-height geometry, so the matrix
 * only places, turns, leans, and slightly scales the instance. Seeded jitter
 * keeps repeated wall cells from looking copied.
 */
export function getWallInstanceData(layout: DungeonLayout): WallInstanceData {
  const key = cacheKey(layout);
  const cached = cache.get(key);
  if (cached) return cached;

  const data = buildWallMatrices(layout);
  cache.set(key, data);
  return data;
}
