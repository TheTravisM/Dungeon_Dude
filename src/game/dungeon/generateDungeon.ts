import type {
  DungeonLayout,
  DungeonRoom,
  DungeonWallCell,
  DungeonWallRun,
  GridCell,
  Position,
  WallHeight,
} from '../../types';
import {
  DUNGEON_MARGIN,
  DUNGEON_ROOM_TARGET,
  DUNGEON_SIZE,
  FLOOR_TOP,
} from './constants';
import { createRandom } from './random';

const FLOOR = 1;

/**
 * Builds a connected dungeon from a seed. The layout is a plain data object;
 * rendering and collision both consume it, so the generator can be tested
 * without a WebGL context.
 *
 * Strategy: carve a centered starting room, scatter non-overlapping rooms,
 * connect every room to the previous one with an L-shaped two-tile corridor,
 * then derive wall cells from floor adjacency. Because rooms form a chain,
 * every carved space is reachable.
 */
export function generateDungeon(seed: number, size = DUNGEON_SIZE): DungeonLayout {
  const rng = createRandom(seed);
  const grid = new Uint8Array(size * size);
  const rooms: DungeonRoom[] = [];

  const index = (x: number, z: number) => z * size + x;

  const carve = (x: number, z: number) => {
    if (x >= 0 && z >= 0 && x < size && z < size) grid[index(x, z)] = FLOOR;
  };

  const carveRoom = (room: DungeonRoom) => {
    for (let z = room.z; z < room.z + room.depth; z++) {
      for (let x = room.x; x < room.x + room.width; x++) carve(x, z);
    }
  };

  const placeRoom = (x: number, z: number, width: number, depth: number) => {
    if (
      x < DUNGEON_MARGIN ||
      z < DUNGEON_MARGIN ||
      x + width > size - DUNGEON_MARGIN ||
      z + depth > size - DUNGEON_MARGIN
    ) {
      return null;
    }

    // Keep one empty tile between rooms so their walls do not merge into
    // unreadable blocks.
    for (const room of rooms) {
      if (
        x < room.x + room.width + 1 &&
        x + width + 1 > room.x &&
        z < room.z + room.depth + 1 &&
        z + depth + 1 > room.z
      ) {
        return null;
      }
    }

    const room: DungeonRoom = {
      x,
      z,
      width,
      depth,
      center: { x: x + (width >> 1), z: z + (depth >> 1) },
    };

    rooms.push(room);
    carveRoom(room);
    return room;
  };

  // The first room contains the grid center so the hero and the physics probe
  // always spawn over solid floor.
  const firstWidth = 5 + rng.int(0, 2);
  const firstDepth = 5 + rng.int(0, 2);
  placeRoom(
    Math.floor((size - firstWidth) / 2),
    Math.floor((size - firstDepth) / 2),
    firstWidth,
    firstDepth
  );

  let attempts = 0;
  while (rooms.length < DUNGEON_ROOM_TARGET && attempts < 80) {
    attempts++;
    const width = 3 + rng.int(0, 2);
    const depth = 3 + rng.int(0, 2);
    const maxX = size - DUNGEON_MARGIN - width;
    const maxZ = size - DUNGEON_MARGIN - depth;
    placeRoom(
      DUNGEON_MARGIN + rng.int(0, maxX - DUNGEON_MARGIN),
      DUNGEON_MARGIN + rng.int(0, maxZ - DUNGEON_MARGIN),
      width,
      depth
    );
  }

  const carveHorizontal = (z: number, x1: number, x2: number) => {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
      carve(x, z);
      carve(x, z + 1);
    }
  };

  const carveVertical = (x: number, z1: number, z2: number) => {
    const start = Math.min(z1, z2);
    const end = Math.max(z1, z2);
    for (let z = start; z <= end; z++) {
      carve(x, z);
      carve(x + 1, z);
    }
  };

  for (let i = 1; i < rooms.length; i++) {
    const from = rooms[i - 1].center;
    const to = rooms[i].center;
    if (i % 2 === 1) {
      carveHorizontal(from.z, from.x, to.x);
      carveVertical(to.x, from.z, to.z);
    } else {
      carveVertical(from.x, from.z, to.z);
      carveHorizontal(to.z, from.x, to.x);
    }
  }

  const floorCells: GridCell[] = [];
  const wallCells: DungeonWallCell[] = [];
  const wallHeightAt = new Map<number, WallHeight>();

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      if (grid[index(x, z)] === FLOOR) {
        floorCells.push({ x, z });
        continue;
      }

      let touchesFloor = false;
      for (let dz = -1; dz <= 1 && !touchesFloor; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const nz = z + dz;
          if (
            (dx !== 0 || dz !== 0) &&
            nx >= 0 &&
            nz >= 0 &&
            nx < size &&
            nz < size &&
            grid[index(nx, nz)] === FLOOR
          ) {
            touchesFloor = true;
            break;
          }
        }
      }

      if (touchesFloor) {
        // The camera looks from positive x and z, so only the far perimeter
        // (x = 0, z = 0) stays full height. Everything else becomes a ledge.
        const height: WallHeight = x === 0 || z === 0 ? 'tall' : 'low';
        wallCells.push({ x, z, height });
        wallHeightAt.set(index(x, z), height);
      }
    }
  }

  // Merge wall cells into horizontal strips. Visuals still use per-tile
  // instances, but collision gets a handful of long cuboids instead of one
  // collider per wall tile.
  const wallRuns: DungeonWallRun[] = [];
  const heights: WallHeight[] = ['tall', 'low'];

  for (const height of heights) {
    for (let z = 0; z < size; z++) {
      let x = 0;
      while (x < size) {
        if (wallHeightAt.get(index(x, z)) !== height) {
          x++;
          continue;
        }
        const start = x;
        while (x < size && wallHeightAt.get(index(x, z)) === height) x++;
        wallRuns.push({ x: start, z, width: x - start, depth: 1, height });
      }
    }
  }

  const spawnCell = rooms[0].center;
  const spawn: Position = {
    x: spawnCell.x - (size - 1) / 2,
    y: FLOOR_TOP,
    z: spawnCell.z - (size - 1) / 2,
  };

  return { seed, size, rooms, floorCells, wallCells, wallRuns, spawn };
}
