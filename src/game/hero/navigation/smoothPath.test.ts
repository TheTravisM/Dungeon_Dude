import { describe, expect, it } from 'vitest';
import type { GridCell } from '../../../types';
import { generateDungeon } from '../../dungeon/generateDungeon';
import { gridToWorld, worldToGrid } from '../../dungeon/constants';
import { HERO_PATH_CLEARANCE } from '../constants';
import { planGridPath, type WorldPoint } from './heroPath';
import { hasClearLine, smoothPath } from './smoothPath';
import type { WalkGrid } from './walkGrid';
import { createWalkGrid } from './walkGrid';

function makeGrid(rows: string[]): WalkGrid {
  const size = rows.length;
  return {
    size,
    isWalkable(x, z) {
      return x >= 0 && z >= 0 && x < size && z < size && rows[z]?.[x] === '.';
    },
  };
}

function worldOf(cell: GridCell, size: number): WorldPoint {
  return { x: gridToWorld(cell.x, size), z: gridToWorld(cell.z, size) };
}

function cellsToWorld(cells: GridCell[], size: number): WorldPoint[] {
  return cells.map((cell) => worldOf(cell, size));
}

function segmentLength(a: WorldPoint, b: WorldPoint): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

function pathLength(start: WorldPoint, points: WorldPoint[]): number {
  let total = 0;
  let previous = start;
  for (const point of points) {
    total += segmentLength(previous, point);
    previous = point;
  }
  return total;
}

function visitedCells(
  start: WorldPoint,
  points: WorldPoint[],
  size: number
): Set<string> {
  const visited = new Set<string>();
  let previous = start;

  for (const point of points) {
    const steps = Math.max(
      1,
      Math.ceil(segmentLength(previous, point) / 0.1)
    );
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      visited.add(
        `${worldToGrid(previous.x + (point.x - previous.x) * t, size)},` +
          `${worldToGrid(previous.z + (point.z - previous.z) * t, size)}`
      );
    }
    previous = point;
  }

  return visited;
}

const OPEN_ROOM = makeGrid([
  '.......',
  '.......',
  '.......',
  '.......',
  '.......',
  '.......',
  '.......',
]);

const L_CORRIDOR = makeGrid([
  '#######',
  '#.....#',
  '#####.#',
  '#.....#',
  '#.#####',
  '#.....#',
  '#######',
]);

const DOORWAY = makeGrid([
  '#########',
  '#...#...#',
  '#...#...#',
  '#.......#',
  '#...#...#',
  '#...#...#',
  '#...#...#',
  '#...#...#',
  '#########',
]);

function rawWorldPath(
  grid: WalkGrid,
  from: GridCell,
  to: GridCell
): WorldPoint[] | null {
  const cells = planGridPath(grid, from, to);
  return cells ? cellsToWorld(cells, grid.size) : null;
}

describe('smoothPath', () => {
  it('collapses a diagonal across an open room to one or two points', () => {
    const start = worldOf({ x: 1, z: 1 }, OPEN_ROOM.size);
    const goal = { x: 5, z: 5 };
    const raw = rawWorldPath(OPEN_ROOM, { x: 1, z: 1 }, goal);
    expect(raw).not.toBeNull();
    if (!raw) return;

    const smoothed = smoothPath(OPEN_ROOM, start, raw);

    expect(smoothed.length).toBeGreaterThan(0);
    expect(smoothed.length).toBeLessThanOrEqual(2);
    expect(smoothed[smoothed.length - 1]).toEqual(worldOf(goal, OPEN_ROOM.size));
  });

  it('keeps an L-corridor corner instead of cutting it', () => {
    const start = worldOf({ x: 1, z: 1 }, L_CORRIDOR.size);
    const goal = { x: 5, z: 5 };
    const raw = rawWorldPath(L_CORRIDOR, { x: 1, z: 1 }, goal);
    expect(raw).not.toBeNull();
    if (!raw) return;

    const smoothed = smoothPath(L_CORRIDOR, start, raw);

    expect(smoothed).toContainEqual(worldOf({ x: 5, z: 1 }, L_CORRIDOR.size));
    expect(smoothed[smoothed.length - 1]).toEqual(worldOf(goal, L_CORRIDOR.size));
  });

  it('passes through the center cell of a one-tile doorway', () => {
    const start = worldOf({ x: 1, z: 1 }, DOORWAY.size);
    const goal = { x: 7, z: 1 };
    const raw = rawWorldPath(DOORWAY, { x: 1, z: 1 }, goal);
    expect(raw).not.toBeNull();
    if (!raw) return;

    const smoothed = smoothPath(DOORWAY, start, raw);
    const visited = visitedCells(start, smoothed, DOORWAY.size);

    expect(visited.has('4,3')).toBe(true);
    expect(smoothed[smoothed.length - 1]).toEqual(worldOf(goal, DOORWAY.size));
  });

  it('returns empty for empty input and the point for a single step', () => {
    const start = worldOf({ x: 1, z: 1 }, OPEN_ROOM.size);
    const point = worldOf({ x: 2, z: 1 }, OPEN_ROOM.size);

    expect(smoothPath(OPEN_ROOM, start, [])).toEqual([]);
    expect(smoothPath(OPEN_ROOM, start, [point])).toEqual([point]);
  });

  it('keeps every segment clear, ends at the goal, and never lengthens', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const layout = generateDungeon(seed);
      const grid = createWalkGrid(layout);
      const startCell = layout.rooms[0].center;
      const start = worldOf(startCell, layout.size);

      for (const room of layout.rooms.slice(1)) {
        const raw = rawWorldPath(grid, startCell, room.center);
        expect(raw).not.toBeNull();
        if (!raw) continue;

        const smoothed = smoothPath(grid, start, raw);

        expect(smoothed.length).toBeLessThanOrEqual(raw.length);
        expect(smoothed[smoothed.length - 1]).toEqual(
          worldOf(room.center, layout.size)
        );
        expect(pathLength(start, smoothed)).toBeLessThanOrEqual(
          pathLength(start, raw) + 0.001
        );

        let previous = start;
        for (const point of smoothed) {
          expect(
            hasClearLine(grid, previous, point, HERO_PATH_CLEARANCE)
          ).toBe(true);
          previous = point;
        }
      }
    }
  });
});
