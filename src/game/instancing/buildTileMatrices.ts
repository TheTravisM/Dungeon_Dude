import type { DungeonLayout } from '../../types';
import {
  FLOOR_TOP,
  FLOOR_TILE_HEIGHT,
  FLOOR_TILE_INSET,
  WALL_HEIGHT_LOW,
  WALL_HEIGHT_TALL,
  gridToWorld,
} from '../dungeon/constants';
import {
  FLOOR_MAX_JITTER,
  FLOOR_TILT_RANGE,
  WALL_LEAN_RANGE,
  WALL_SCALE_RANGE,
} from '../../config/dioramaConfig';
import { createCellRandom, range } from './seededRandom';

/** Matrix elements per instance: Three stores a column-major 4x4 matrix. */
export const MATRIX_STRIDE = 16;

export interface WallMatrixData {
  tall: Float32Array;
  low: Float32Array;
  /** Both height batches in one buffer for a single instanced draw call. */
  combined: Float32Array;
  tallCount: number;
  lowCount: number;
  count: number;
}

export interface TileMatrixData extends WallMatrixData {
  floor: Float32Array;
  floorCount: number;
}

/**
 * Writes T * R * S into a flat column-major matrix. Rotation order is YXZ:
 * yaw first, then the small x and z leans. Keeping the math local avoids
 * importing Three into a module that the Node verifier and Vitest exercise.
 */
function writeMatrix(
  target: Float32Array,
  offset: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number,
  leanX: number,
  yaw: number,
  leanZ: number,
  x: number,
  y: number,
  z: number
): void {
  const cx = Math.cos(leanX);
  const sx = Math.sin(leanX);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cz = Math.cos(leanZ);
  const sz = Math.sin(leanZ);

  // R = Ry * Rx * Rz, expanded so the loop allocates nothing.
  const r00 = cy * cz + sy * sx * sz;
  const r01 = -cy * sz + sy * sx * cz;
  const r02 = sy * cx;
  const r10 = cx * sz;
  const r11 = cx * cz;
  const r12 = -sx;
  const r20 = -sy * cz + cy * sx * sz;
  const r21 = sy * sz + cy * sx * cz;
  const r22 = cy * cx;

  target[offset] = r00 * scaleX;
  target[offset + 1] = r10 * scaleX;
  target[offset + 2] = r20 * scaleX;
  target[offset + 3] = 0;
  target[offset + 4] = r01 * scaleY;
  target[offset + 5] = r11 * scaleY;
  target[offset + 6] = r21 * scaleY;
  target[offset + 7] = 0;
  target[offset + 8] = r02 * scaleZ;
  target[offset + 9] = r12 * scaleZ;
  target[offset + 10] = r22 * scaleZ;
  target[offset + 11] = 0;
  target[offset + 12] = x;
  target[offset + 13] = y;
  target[offset + 14] = z;
  target[offset + 15] = 1;
}

/**
 * Builds one transform per walkable cell. Each tile is seeded into a small Y
 * offset, a tiny Z tilt, and an optional quarter-turn so the flagstones read as
 * uneven rather than printed. The collider stays flat, so the visual jitter
 * never changes what the hero can walk on.
 */
export function buildFloorMatrices(layout: DungeonLayout): Float32Array {
  const scale = 1 - FLOOR_TILE_INSET * 2;
  const centerY = FLOOR_TOP - FLOOR_TILE_HEIGHT / 2;
  const matrices = new Float32Array(layout.floorCells.length * MATRIX_STRIDE);

  for (let index = 0; index < layout.floorCells.length; index++) {
    const cell = layout.floorCells[index];
    const random = createCellRandom(cell.x, cell.z, layout.seed);
    const yOffset = range(random, -FLOOR_MAX_JITTER, FLOOR_MAX_JITTER);
    const tiltZ = range(random, -FLOOR_TILT_RANGE, FLOOR_TILT_RANGE);
    const yaw = Math.floor(random() * 4) * (Math.PI / 2);

    writeMatrix(
      matrices,
      index * MATRIX_STRIDE,
      scale,
      1,
      scale,
      0,
      yaw,
      tiltZ,
      gridToWorld(cell.x, layout.size),
      centerY + yOffset,
      gridToWorld(cell.z, layout.size)
    );
  }

  return matrices;
}

/**
 * Builds transforms for both wall height batches. Yaw stays on 90 degree steps
 * so walls keep their grid alignment; scale and lean are tiny and seeded. The
 * fixed-height geometry means the vertical scale changes the visible height
 * while the collider stays at the approved full height.
 */
export function buildWallMatrices(layout: DungeonLayout): WallMatrixData {
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
    const height = isTall ? WALL_HEIGHT_TALL : WALL_HEIGHT_LOW;
    const target = isTall ? tall : low;
    const offset = (isTall ? tallIndex++ : lowIndex++) * MATRIX_STRIDE;
    const random = createCellRandom(cell.x, cell.z, layout.seed ^ 0x51ed270b);
    const yaw = Math.floor(random() * 4) * (Math.PI / 2);
    const scale = 1 + range(random, -WALL_SCALE_RANGE, WALL_SCALE_RANGE);
    const leanX = range(random, -WALL_LEAN_RANGE, WALL_LEAN_RANGE);
    const leanZ = range(random, -WALL_LEAN_RANGE, WALL_LEAN_RANGE);

    writeMatrix(
      target,
      offset,
      scale,
      scale,
      scale,
      leanX,
      yaw,
      leanZ,
      gridToWorld(cell.x, layout.size),
      (height * scale) / 2,
      gridToWorld(cell.z, layout.size)
    );
  }

  return {
    tall,
    low,
    combined: combineWallBatches(tall, tallCount, low, lowCount),
    tallCount,
    lowCount,
    count: tallCount + lowCount,
  };
}

/**
 * Copies the two height batches into one buffer and bakes the wall height into
 * the Y basis. The renderer then needs a unit-height geometry and one instanced
 * draw call for the whole dungeon wall set.
 */
function combineWallBatches(
  tall: Float32Array,
  tallCount: number,
  low: Float32Array,
  lowCount: number
): Float32Array {
  const combined = new Float32Array((tallCount + lowCount) * MATRIX_STRIDE);
  combined.set(tall, 0);
  combined.set(low, tallCount * MATRIX_STRIDE);

  for (let index = 0; index < tallCount; index++) {
    const offset = index * MATRIX_STRIDE;
    combined[offset + 4] *= WALL_HEIGHT_TALL;
    combined[offset + 5] *= WALL_HEIGHT_TALL;
    combined[offset + 6] *= WALL_HEIGHT_TALL;
  }
  for (let index = 0; index < lowCount; index++) {
    const offset = (tallCount + index) * MATRIX_STRIDE;
    combined[offset + 4] *= WALL_HEIGHT_LOW;
    combined[offset + 5] *= WALL_HEIGHT_LOW;
    combined[offset + 6] *= WALL_HEIGHT_LOW;
  }

  return combined;
}

/** Convenience wrapper used by the renderers and the deterministic tests. */
export function buildTileMatrices(layout: DungeonLayout): TileMatrixData {
  const floor = buildFloorMatrices(layout);
  const walls = buildWallMatrices(layout);
  return {
    floor,
    floorCount: layout.floorCells.length,
    ...walls,
  };
}
