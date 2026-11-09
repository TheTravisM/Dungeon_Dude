import type {
  DungeonLayout,
  DungeonWallCell,
  DungeonWallRun,
  Position,
  WallHeight,
} from '../../types';
import { DUNGEON_SIZE, FLOOR_TOP } from './constants';
import { isFullyConnected } from './connectivity';
import { carveCorridors } from './corridors';
import { createRandom } from './random';
import { placeRooms } from './rooms';

/**
 * Builds a connected dungeon from a seed. The layout is a plain data object;
 * rendering and collision both consume it, so the generator can be tested
 * without a WebGL context.
 *
 * Strategy: place non-overlapping rooms, connect them with one-tile L-shaped
 * corridors using a deterministic spanning tree, then derive wall cells from
 * floor adjacency. Every carved floor cell is reachable from the start room.
 */
export function generateDungeon(seed: number, size = DUNGEON_SIZE): DungeonLayout {
  const rng = createRandom(seed);
  const placement = placeRooms(rng, size);

  if (!placement.ok) {
    throw new Error(`Dungeon generation failed for seed ${seed}: ${placement.reason}`);
  }

  const rooms = placement.rooms;
  const { floorCells } = carveCorridors(rooms, rng, size);
  const index = (x: number, z: number) => z * size + x;
  const floorMask = new Uint8Array(size * size);

  for (const cell of floorCells) floorMask[index(cell.x, cell.z)] = 1;

  if (!isFullyConnected(floorCells, size, rooms[0].center)) {
    throw new Error(`Dungeon floor is disconnected for seed ${seed}`);
  }

  const wallCells: DungeonWallCell[] = [];
  const wallHeightAt = new Map<number, WallHeight>();

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      if (floorMask[index(x, z)] === 1) {
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
            floorMask[index(nx, nz)] === 1
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
