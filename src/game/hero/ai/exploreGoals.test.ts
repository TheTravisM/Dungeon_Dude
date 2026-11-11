import { describe, expect, it } from 'vitest';
import type { DungeonLayout, GridCell } from '../../../types';
import { generateDungeon } from '../../dungeon/generateDungeon';
import { gridToWorld } from '../../dungeon/constants';
import { createRandom } from '../../dungeon/random';
import { createWalkGrid } from '../navigation/walkGrid';
import {
  createExploreState,
  markVisited,
  pickNextRoom,
  pickWanderCell,
  roomIndexAt,
} from './exploreGoals';

const SEEDS = Array.from({ length: 50 }, (_, index) => index + 1);

function worldOf(cell: GridCell, size: number) {
  return { x: gridToWorld(cell.x, size), z: gridToWorld(cell.z, size) };
}

function exploreOrder(layout: DungeonLayout, rngSeed: number): number[] {
  const grid = createWalkGrid(layout);
  const state = createExploreState();
  const rng = createRandom(rngSeed);
  let from = worldOf(layout.rooms[0].center, layout.size);

  // The hero starts inside the first room, so it counts as visited.
  markVisited(state, 0);

  const order: number[] = [];
  for (let step = 1; step < layout.rooms.length; step++) {
    const next = pickNextRoom(layout, grid, state, from, rng);
    expect(next).not.toBeNull();
    if (next === null) break;

    order.push(next);
    markVisited(state, next);
    from = worldOf(layout.rooms[next].center, layout.size);
  }
  return order;
}

describe('roomIndexAt', () => {
  it('returns the room containing each room center', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);

      layout.rooms.forEach((room, index) => {
        expect(roomIndexAt(layout, worldOf(room.center, layout.size))).toBe(index);
      });
    }
  });

  it('returns null for a corridor cell outside every room', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      const corridor = layout.floorCells.find(
        (cell) => roomIndexAt(layout, worldOf(cell, layout.size)) === null
      );

      expect(corridor).toBeDefined();
      if (corridor) {
        expect(roomIndexAt(layout, worldOf(corridor, layout.size))).toBeNull();
      }
    }
  });
});

describe('pickNextRoom', () => {
  it('visits every other room exactly once per sweep', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      const order = exploreOrder(layout, seed);

      expect(order.length).toBe(layout.rooms.length - 1);
      expect(new Set(order).size).toBe(order.length);
      expect(order).not.toContain(0);
    }
  });

  it('is deterministic for the same layout, state, and rng seed', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);

      expect(exploreOrder(layout, seed)).toEqual(exploreOrder(layout, seed));
    }
  });

  it('starts a new sweep once every room has been visited', () => {
    const layout = generateDungeon(SEEDS[0]);
    const grid = createWalkGrid(layout);
    const state = createExploreState();
    const rng = createRandom(7);
    const lastRoom = layout.rooms[layout.rooms.length - 1].center;

    for (let index = 0; index < layout.rooms.length; index++) {
      markVisited(state, index);
    }

    const next = pickNextRoom(
      layout,
      grid,
      state,
      worldOf(lastRoom, layout.size),
      rng
    );

    expect(next).not.toBeNull();
    expect(next).not.toBe(layout.rooms.length - 1);
    expect(state.visited.size).toBe(1);
    expect(state.visited.has(layout.rooms.length - 1)).toBe(true);
  });

  it('returns null when the only other room is unreachable', () => {
    const size = 7;
    const floorCells: GridCell[] = [];
    for (let z = 1; z <= 3; z++) {
      for (let x = 1; x <= 3; x++) floorCells.push({ x, z });
    }
    for (let x = 1; x <= 3; x++) floorCells.push({ x, z: 5 });

    const layout = {
      seed: 1,
      size,
      rooms: [
        { x: 1, z: 1, width: 3, depth: 3, center: { x: 2, z: 2 } },
        { x: 1, z: 5, width: 3, depth: 1, center: { x: 2, z: 5 } },
      ],
      floorCells,
      wallCells: [],
      wallRuns: [],
      spawn: { x: gridToWorld(2, size), y: 0.06, z: gridToWorld(2, size) },
    } as DungeonLayout;

    const grid = createWalkGrid(layout);
    const state = createExploreState();
    const rng = createRandom(3);

    const next = pickNextRoom(
      layout,
      grid,
      state,
      worldOf(layout.rooms[0].center, size),
      rng
    );

    expect(next).toBeNull();
  });
});

describe('pickWanderCell', () => {
  it('returns a walkable cell at least four steps from the hero', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const layout = generateDungeon(seed);
      const grid = createWalkGrid(layout);
      const from = worldOf(layout.rooms[0].center, layout.size);
      const cell = pickWanderCell(grid, layout, from, createRandom(seed));

      expect(cell).not.toBeNull();
      if (!cell) continue;

      expect(grid.isWalkable(cell.x, cell.z)).toBe(true);
      const fromCell = layout.rooms[0].center;
      const distance =
        Math.abs(cell.x - fromCell.x) + Math.abs(cell.z - fromCell.z);
      expect(distance).toBeGreaterThanOrEqual(4);
    }
  });

  it('is deterministic for the same rng seed', () => {
    const layout = generateDungeon(SEEDS[0]);
    const grid = createWalkGrid(layout);
    const from = worldOf(layout.rooms[0].center, layout.size);

    expect(pickWanderCell(grid, layout, from, createRandom(11))).toEqual(
      pickWanderCell(grid, layout, from, createRandom(11))
    );
  });
});
