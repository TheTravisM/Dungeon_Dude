import type { DungeonLayout } from '../../types';
import {
  WALL_HEIGHT_LOW,
  WALL_HEIGHT_TALL,
  gridToWorld,
} from './constants';

const MATRIX_STRIDE = 16;

export interface WallInstanceData {
  /** Transforms for the tall far-edge backdrop. */
  tall: Float32Array;
  /** Transforms for low ledges and interior walls. */
  low: Float32Array;
  tallCount: number;
  lowCount: number;
}

const cache = new Map<string, WallInstanceData>();

function cacheKey(layout: DungeonLayout): string {
  return `${layout.seed}:${layout.size}`;
}

/**
 * Builds one transform per wall cell, split by cutaway height. Each batch uses
 * a fixed-height box geometry, so the matrix only translates the instance; the
 * horizontal scale stays one tile and the stone pattern never stretches on a
 * long merged wall. Wall cells are non-floor cells, so the bottom sits on the
 * plinth top at y = 0.
 */
export function getWallInstanceData(layout: DungeonLayout): WallInstanceData {
  const key = cacheKey(layout);
  const cached = cache.get(key);
  if (cached) return cached;

  let tallCount = 0;
  let lowCount = 0;
  for (const cell of layout.wallCells) {
    if (cell.height === 'tall') tallCount++;
    else lowCount++;
  }

  const tall = new Float32Array(tallCount * MATRIX_STRIDE);
  const low = new Float32Array(lowCount * MATRIX_STRIDE);
  let tallIndex = 0;
  let lowIndex = 0;

  for (const cell of layout.wallCells) {
    const isTall = cell.height === 'tall';
    const target = isTall ? tall : low;
    const height = isTall ? WALL_HEIGHT_TALL : WALL_HEIGHT_LOW;
    const offset = (isTall ? tallIndex++ : lowIndex++) * MATRIX_STRIDE;

    target[offset] = 1;
    target[offset + 5] = 1;
    target[offset + 10] = 1;
    target[offset + 12] = gridToWorld(cell.x, layout.size);
    target[offset + 13] = height / 2;
    target[offset + 14] = gridToWorld(cell.z, layout.size);
    target[offset + 15] = 1;
  }

  const data = { tall, low, tallCount, lowCount };
  cache.set(key, data);
  return data;
}
