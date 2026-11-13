import { describe, expect, it } from 'vitest';
import { generateDungeon } from '../dungeon/generateDungeon';
import { FLOOR_TOP, FLOOR_TILE_HEIGHT } from '../dungeon/constants';
import { FLOOR_MAX_JITTER } from '../../config/dioramaConfig';
import {
  MATRIX_STRIDE,
  buildFloorMatrices,
  buildTileMatrices,
  buildWallMatrices,
} from './buildTileMatrices';

const layout = generateDungeon(1337);

describe('buildTileMatrices', () => {
  it('is deterministic for the same seed', () => {
    const first = buildTileMatrices(layout);
    const second = buildTileMatrices(layout);
    expect(Array.from(first.floor)).toEqual(Array.from(second.floor));
    expect(Array.from(first.tall)).toEqual(Array.from(second.tall));
    expect(Array.from(first.low)).toEqual(Array.from(second.low));
  });

  it('creates one floor matrix per walkable cell', () => {
    const floor = buildFloorMatrices(layout);
    expect(floor.length).toBe(layout.floorCells.length * MATRIX_STRIDE);
  });

  it('keeps the planted Y jitter inside the configured bounds', () => {
    const floor = buildFloorMatrices(layout);
    const centerY = FLOOR_TOP - FLOOR_TILE_HEIGHT / 2;
    for (let index = 0; index < layout.floorCells.length; index++) {
      const y = floor[index * MATRIX_STRIDE + 13];
      expect(Math.abs(y - centerY)).toBeLessThanOrEqual(FLOOR_MAX_JITTER + 1e-6);
    }
  });

  it('keeps wall batches aligned with the wall cell counts', () => {
    const walls = buildWallMatrices(layout);
    const tall = layout.wallCells.filter((cell) => cell.height === 'tall');
    const low = layout.wallCells.filter((cell) => cell.height === 'low');
    expect(walls.tallCount).toBe(tall.length);
    expect(walls.lowCount).toBe(low.length);
    expect(walls.tall.length).toBe(tall.length * MATRIX_STRIDE);
    expect(walls.low.length).toBe(low.length * MATRIX_STRIDE);
  });
});
