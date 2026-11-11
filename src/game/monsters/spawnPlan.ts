import type {
  DungeonLayout,
  GridCell,
  MonsterArchetypeId,
} from '../../types';
import { createRandom } from '../dungeon/random';

export interface SpawnPoint {
  cell: GridCell;
  roomIndex: number;
}

export interface MonsterSpawn extends SpawnPoint {
  archetype: MonsterArchetypeId;
}

export interface SpawnPlan {
  monsters: MonsterSpawn[];
  key: SpawnPoint;
  stairs: SpawnPoint;
}

export const MAX_MONSTERS_PER_ROOM = 3;

const DEPTH_ONE: Readonly<Record<MonsterArchetypeId, number>> = Object.freeze({
  slime: 3,
  skeleton: 1,
  bat: 0,
});
const DEPTH_TWO: Readonly<Record<MonsterArchetypeId, number>> = Object.freeze({
  slime: 2,
  skeleton: 2,
  bat: 1,
});
const DEPTH_FOUR: Readonly<Record<MonsterArchetypeId, number>> = Object.freeze({
  slime: 1,
  skeleton: 2,
  bat: 2,
});

/** Seeded archetype weights. Bats cannot appear on depth 1. */
export function archetypeWeights(
  depth: number
): Readonly<Record<MonsterArchetypeId, number>> {
  if (depth <= 1) return DEPTH_ONE;
  if (depth <= 3) return DEPTH_TWO;
  return DEPTH_FOUR;
}

function manhattan(a: GridCell, b: GridCell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

function roomRng(layout: DungeonLayout, roomIndex: number) {
  return createRandom(
    ((layout.seed ^ 0x51a7b3c9) +
      Math.imul(roomIndex + 1, 0x9e3779b1)) >>> 0
  );
}

function cellsOf(
  layout: DungeonLayout,
  floorKey: Set<string>,
  roomIndex: number,
  excluded: GridCell[]
): GridCell[] {
  const room = layout.rooms[roomIndex];
  const cells: GridCell[] = [];
  for (let z = room.z; z < room.z + room.depth; z++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (x === room.center.x && z === room.center.z) continue;
      if (!floorKey.has(`${x},${z}`)) continue;
      if (excluded.some((cell) => cell.x === x && cell.z === z)) continue;
      cells.push({ x, z });
    }
  }
  return cells;
}

function takeCell(pool: GridCell[], rng: ReturnType<typeof createRandom>): GridCell {
  return pool.splice(rng.int(0, pool.length - 1), 1)[0];
}

function pickArchetype(
  depth: number,
  rng: ReturnType<typeof createRandom>
): MonsterArchetypeId {
  const weights = archetypeWeights(depth);
  const ids: MonsterArchetypeId[] = ['slime', 'skeleton', 'bat'];
  const total = ids.reduce((sum, id) => sum + weights[id], 0);
  let roll = rng.next() * total;
  for (const id of ids) {
    roll -= weights[id];
    if (roll < 0) return id;
  }
  return 'slime';
}

/**
 * Pure deterministic placement. Rooms use independent generators so a depth
 * change cannot reshuffle a room whose count did not change.
 */
export function planSpawns(layout: DungeonLayout, depth: number): SpawnPlan {
  const floorKey = new Set(layout.floorCells.map((cell) => `${cell.x},${cell.z}`));
  const start = layout.rooms[0].center;

  const candidateIndices: number[] = [];
  for (let index = 1; index < layout.rooms.length; index++) candidateIndices.push(index);

  let stairsRoom = candidateIndices[0] ?? 0;
  let bestDistance = -1;
  for (const index of candidateIndices) {
    const distance = manhattan(layout.rooms[index].center, start);
    if (distance > bestDistance) {
      bestDistance = distance;
      stairsRoom = index;
    }
  }

  const keyCandidates = candidateIndices.filter((index) => index !== stairsRoom);
  const keyRoom =
    keyCandidates.length > 0
      ? createRandom(layout.seed ^ 0x6b79e5a3).pick(keyCandidates)
      : stairsRoom;

  // Reserve the marker cells before any monster so they cannot be reused.
  const stairsRng = roomRng(layout, stairsRoom);
  const stairsPool = cellsOf(layout, floorKey, stairsRoom, []);
  const stairsCell = takeCell(stairsPool, stairsRng);

  const keyRng = keyRoom === stairsRoom ? stairsRng : roomRng(layout, keyRoom);
  const keyPool = cellsOf(layout, floorKey, keyRoom, [stairsCell]);
  const keyCell = takeCell(keyPool, keyRng);

  const monsters: MonsterSpawn[] = [];

  for (let roomIndex = 1; roomIndex < layout.rooms.length; roomIndex++) {
    const rng = roomRng(layout, roomIndex);
    const reserved = cellsOf(layout, floorKey, roomIndex, []).filter((cell) => {
      if (roomIndex === stairsRoom && cell.x === stairsCell.x && cell.z === stairsCell.z) return false;
      if (roomIndex === keyRoom && cell.x === keyCell.x && cell.z === keyCell.z) return false;
      return true;
    });
    if (reserved.length === 0) continue;

    const base = 1 + (rng.chance(0.5) ? 1 : 0);
    let count = Math.min(
      MAX_MONSTERS_PER_ROOM,
      base + Math.floor((depth - 1) / 3)
    );
    if (roomIndex === keyRoom) count = Math.max(1, count);
    count = Math.min(count, reserved.length);

    const pool = [...reserved];
    for (let placed = 0; placed < count; placed++) {
      monsters.push({
        cell: takeCell(pool, rng),
        roomIndex,
        archetype: pickArchetype(depth, rng),
      });
    }
  }

  return {
    monsters,
    key: { cell: keyCell, roomIndex: keyRoom },
    stairs: { cell: stairsCell, roomIndex: stairsRoom },
  };
}
