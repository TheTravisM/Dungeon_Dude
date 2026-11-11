import { describe, expect, it } from 'vitest';
import type { DungeonLayout, GridCell } from '../../types';
import { generateDungeon } from '../dungeon/generateDungeon';
import {
  MAX_MONSTERS_PER_ROOM,
  archetypeWeights,
  planSpawns,
  type SpawnPoint,
} from './spawnPlan';

const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);
const DEPTHS = [1, 4, 7];

function insideRoom(layout: DungeonLayout, point: SpawnPoint): boolean {
  const room = layout.rooms[point.roomIndex];
  return (
    point.cell.x >= room.x &&
    point.cell.x < room.x + room.width &&
    point.cell.z >= room.z &&
    point.cell.z < room.z + room.depth
  );
}

function key(cell: GridCell): string {
  return `${cell.x},${cell.z}`;
}

function farthestRoom(layout: DungeonLayout): number {
  const start = layout.rooms[0].center;
  let best = 1;
  let bestDistance = -1;
  for (let index = 1; index < layout.rooms.length; index++) {
    const center = layout.rooms[index].center;
    const distance = Math.abs(center.x - start.x) + Math.abs(center.z - start.z);
    if (distance > bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

describe('planSpawns', () => {
  it('is deterministic and never spawns in the start room', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      for (const depth of DEPTHS) {
        const first = planSpawns(layout, depth);
        const second = planSpawns(layout, depth);
        expect(second).toEqual(first);

        const points = [...first.monsters, first.key, first.stairs];
        for (const point of points) {
          expect(point.roomIndex).not.toBe(0);
        }
      }
    }
  });

  it('places every point inside its room on a floor cell', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      const floor = new Set(layout.floorCells.map(key));
      const plan = planSpawns(layout, 4);
      const points = [...plan.monsters, plan.key, plan.stairs];

      for (const point of points) {
        expect(insideRoom(layout, point)).toBe(true);
        expect(floor.has(key(point.cell))).toBe(true);
        const center = layout.rooms[point.roomIndex].center;
        expect(point.cell).not.toEqual(center);
      }

      const cells = points.map((point) => key(point.cell));
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it('puts stairs in the farthest room and the key in a different room', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      const plan = planSpawns(layout, 1);
      expect(plan.stairs.roomIndex).toBe(farthestRoom(layout));
      expect(plan.key.roomIndex).not.toBe(plan.stairs.roomIndex);
      expect(
        plan.monsters.some((monster) => monster.roomIndex === plan.key.roomIndex)
      ).toBe(true);
    }
  });

  it('keeps 1 to 3 monsters per non-start room, with key-room coverage', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      for (const depth of DEPTHS) {
        const plan = planSpawns(layout, depth);
        const counts = new Map<number, number>();
        for (const monster of plan.monsters) {
          counts.set(monster.roomIndex, (counts.get(monster.roomIndex) ?? 0) + 1);
        }
        for (let room = 1; room < layout.rooms.length; room++) {
          expect(counts.get(room) ?? 0).toBeGreaterThanOrEqual(1);
          expect(counts.get(room) ?? 0).toBeLessThanOrEqual(MAX_MONSTERS_PER_ROOM);
        }
      }
    }
  });

  it('never decreases room totals as depth rises', () => {
    for (const seed of SEEDS) {
      const layout = generateDungeon(seed);
      const shallow = planSpawns(layout, 1).monsters.length;
      const deep = planSpawns(layout, 7).monsters.length;
      expect(deep).toBeGreaterThanOrEqual(shallow);
    }
  });

  it('exposes depth-based archetype weights', () => {
    const depthOne = archetypeWeights(1);
    expect(depthOne.bat).toBe(0);
    for (let depth = 1; depth <= 20; depth++) {
      const weights = archetypeWeights(depth);
      for (const value of Object.values(weights)) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
