import { describe, expect, it } from 'vitest';
import type { DungeonLayout, GridCell } from '../../../types';
import { generateDungeon } from '../../dungeon/generateDungeon';
import { gridToWorld, worldToGrid } from '../../dungeon/constants';
import { planGridPath, planWorldPath } from './heroPath';
import { createWalkGrid } from './walkGrid';

const TEST_SEEDS = [1, 2, 3, 42, 1337];
const CONNECTIVITY_SEEDS = Array.from({ length: 50 }, (_, index) => index + 1);

function manhattan(a: GridCell, b: GridCell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

function layouts(): Array<{ seed: number; layout: DungeonLayout }> {
  return TEST_SEEDS.map((seed) => ({ seed, layout: generateDungeon(seed) }));
}

describe('worldToGrid', () => {
  it('round trips every floor cell in a layout', () => {
    for (const { layout } of layouts()) {
      for (const cell of layout.floorCells) {
        expect(worldToGrid(gridToWorld(cell.x, layout.size), layout.size)).toBe(cell.x);
        expect(worldToGrid(gridToWorld(cell.z, layout.size), layout.size)).toBe(cell.z);
      }
    }
  });
});

describe('planGridPath', () => {
  it('reaches every room center from the start room', () => {
    for (const { layout } of layouts()) {
      const grid = createWalkGrid(layout);
      const start = layout.rooms[0].center;

      for (const room of layout.rooms) {
        expect(planGridPath(grid, start, room.center)).not.toBeNull();
      }
    }
  });

  it('keeps every room center reachable across many seeds', () => {
    for (const seed of CONNECTIVITY_SEEDS) {
      const layout = generateDungeon(seed);
      const grid = createWalkGrid(layout);
      const start = layout.rooms[0].center;

      for (const room of layout.rooms) {
        expect(planGridPath(grid, start, room.center)).not.toBeNull();
      }
    }
  });

  it('returns cardinal one-cell steps over walkable cells', () => {
    for (const { layout } of layouts()) {
      const grid = createWalkGrid(layout);
      const start = layout.rooms[0].center;
      const goal = layout.rooms[layout.rooms.length - 1].center;
      const path = planGridPath(grid, start, goal);

      expect(path).not.toBeNull();
      if (!path) continue;

      let previous = start;
      for (const step of path) {
        expect(manhattan(previous, step)).toBe(1);
        expect(grid.isWalkable(step.x, step.z)).toBe(true);
        previous = step;
      }
      expect(previous).toEqual(goal);
    }
  });

  it('is at least as long as the Manhattan distance and deterministic', () => {
    for (const { layout } of layouts()) {
      const grid = createWalkGrid(layout);
      const start = layout.rooms[0].center;
      const goal = layout.rooms[layout.rooms.length - 1].center;
      const first = planGridPath(grid, start, goal);
      const second = planGridPath(grid, start, goal);

      expect(first).not.toBeNull();
      if (!first) continue;

      expect(first.length).toBeGreaterThanOrEqual(manhattan(start, goal));
      expect(second).toEqual(first);
    }
  });

  it('returns null for an unwalkable goal', () => {
    for (const { layout } of layouts()) {
      const grid = createWalkGrid(layout);
      const start = layout.rooms[0].center;
      const wall = layout.wallCells[0];

      expect(planGridPath(grid, start, wall)).toBeNull();
    }
  });

  it('returns an empty path when start equals goal', () => {
    const { layout } = layouts()[0];
    const grid = createWalkGrid(layout);
    const start = layout.rooms[0].center;

    expect(planGridPath(grid, start, start)).toEqual([]);
  });
});

describe('planWorldPath', () => {
  it('returns cell-center world points, excluding start and including goal', () => {
    for (const { layout } of layouts()) {
      const startCell = layout.rooms[0].center;
      const goalCell = layout.rooms[layout.rooms.length - 1].center;
      const from = {
        x: gridToWorld(startCell.x, layout.size),
        z: gridToWorld(startCell.z, layout.size),
      };
      const to = {
        x: gridToWorld(goalCell.x, layout.size),
        z: gridToWorld(goalCell.z, layout.size),
      };

      const path = planWorldPath(layout, from, to);
      expect(path).not.toBeNull();
      if (!path) continue;

      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual(to);
      for (const point of path) {
        expect(Math.abs(point.x % 1)).toBeCloseTo(0.5);
        expect(Math.abs(point.z % 1)).toBeCloseTo(0.5);
      }
    }
  });

  it('returns an empty path for the same world position', () => {
    const { layout } = layouts()[0];
    const from = { x: layout.spawn.x, z: layout.spawn.z };

    expect(planWorldPath(layout, from, from)).toEqual([]);
  });

  it('returns null when the target lands on a wall', () => {
    const { layout } = layouts()[0];
    const wall = layout.wallCells[0];
    const to = {
      x: gridToWorld(wall.x, layout.size),
      z: gridToWorld(wall.z, layout.size),
    };

    expect(
      planWorldPath(layout, { x: layout.spawn.x, z: layout.spawn.z }, to)
    ).toBeNull();
  });
});
