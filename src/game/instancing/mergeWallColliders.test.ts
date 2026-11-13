import { describe, expect, it } from 'vitest';
import { generateDungeon } from '../dungeon/generateDungeon';
import { mergeWallColliders } from './mergeWallColliders';

const layout = generateDungeon(1337);

describe('mergeWallColliders', () => {
  it('covers every wall cell exactly once', () => {
    const rectangles = mergeWallColliders(layout.wallCells, layout.size);
    const covered = new Map<string, number>();

    for (const rectangle of rectangles) {
      expect(rectangle.width).toBeGreaterThan(0);
      expect(rectangle.depth).toBeGreaterThan(0);
      for (let z = rectangle.z; z < rectangle.z + rectangle.depth; z++) {
        for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) {
          const key = `${x},${z}`;
          covered.set(key, (covered.get(key) ?? 0) + 1);
        }
      }
    }

    expect(covered.size).toBe(layout.wallCells.length);
    for (const cell of layout.wallCells) {
      expect(covered.get(`${cell.x},${cell.z}`)).toBe(1);
    }
  });

  it('is deterministic and does not exceed the cell count', () => {
    const first = mergeWallColliders(layout.wallCells, layout.size);
    const second = mergeWallColliders(layout.wallCells, layout.size);
    expect(first).toEqual(second);
    expect(first.length).toBeLessThanOrEqual(layout.wallCells.length);
  });
});
