import { describe, expect, it } from 'vitest';
import { createRandom } from '../dungeon/random';
import { createSpatialHash } from './spatialHash';

interface Point {
  x: number;
  z: number;
}

describe('createSpatialHash', () => {
  it('matches brute force across many random layouts and queries', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = createRandom(seed);
      const hash = createSpatialHash<number>(2);
      const points: Point[] = [];

      for (let index = 0; index < 30; index++) {
        points.push({ x: rng.next() * 20 - 10, z: rng.next() * 20 - 10 });
      }
      points.push({ x: 2, z: 2 }, { x: -2, z: -2 }, { x: 0, z: 0 });

      points.forEach((point, index) => hash.insert(index, point.x, point.z));

      for (let query = 0; query < 40; query++) {
        const x = rng.next() * 24 - 12;
        const z = rng.next() * 24 - 12;
        const radius = 0.3 + rng.next() * 7.7;

        const expected: number[] = [];
        points.forEach((point, index) => {
          const dx = point.x - x;
          const dz = point.z - z;
          if (dx * dx + dz * dz <= radius * radius) expected.push(index);
        });

        expect(hash.queryRadius(x, z, radius, [])).toEqual(expected);
      }
    }
  });

  it('includes points exactly on the boundary and excludes just beyond', () => {
    const hash = createSpatialHash<number>(2);
    hash.insert(1, 3, 0);

    expect(hash.queryRadius(0, 0, 3, [])).toEqual([1]);
    expect(hash.queryRadius(0, 0, 2.999, [])).toEqual([]);
  });

  it('handles negative coordinates on both sides of zero', () => {
    const hash = createSpatialHash<number>(2);
    hash.insert(1, -3, -4);
    hash.insert(2, 3, 4);

    expect(hash.queryRadius(-3, -4, 0.1, [])).toEqual([1]);
    expect(hash.queryRadius(0, 0, 5.01, [])).toEqual([1, 2]);
  });

  it('clears in place and can be reused', () => {
    const hash = createSpatialHash<number>(2);
    hash.insert(1, 0, 0);
    expect(hash.size).toBe(1);

    hash.clear();
    expect(hash.size).toBe(0);
    expect(hash.queryRadius(0, 0, 10, [])).toEqual([]);

    hash.insert(2, 0, 0);
    expect(hash.size).toBe(1);
    expect(hash.queryRadius(0, 0, 10, [])).toEqual([2]);
  });

  it('reuses the caller output array and removes stale contents', () => {
    const hash = createSpatialHash<number>(2);
    hash.insert(7, 0, 0);
    const out = [99];

    expect(hash.queryRadius(0, 0, 1, out)).toBe(out);
    expect(out).toEqual([7]);
  });

  it('finds the nearest item and breaks ties by insertion order', () => {
    const hash = createSpatialHash<number>(2);
    hash.insert(10, -1, 0);
    hash.insert(11, 1, 0);

    expect(hash.nearest(0, 0, 5)).toBe(10);
    expect(hash.nearest(0, 0, 0.5)).toBeNull();
    expect(hash.nearest(0, 0, Number.NaN)).toBeNull();
    expect(hash.nearest(0, 0, -1)).toBeNull();
    expect(hash.nearest(0, 0, Infinity)).toBeNull();
  });
});
