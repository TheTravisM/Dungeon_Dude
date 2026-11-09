import type { DungeonLayout, Position } from '../../types';
import { DUNGEON_SIZE, FLOOR_TOP } from './constants';
import { isFullyConnected } from './connectivity';
import { carveCorridors } from './corridors';
import { createRandom } from './random';
import { placeRooms } from './rooms';
import { generateWalls } from './walls';

/**
 * Builds a connected dungeon from a seed. The layout is a plain data object;
 * rendering and collision both consume it, so the generator can be tested
 * without a WebGL context.
 *
 * Strategy: place non-overlapping rooms, connect them with one-tile corridors
 * using a deterministic spanning tree plus at most one loop, then derive walls
 * from exposed floor edges and merge them into precomputed cutaway runs. Every
 * carved floor cell is reachable from the start room.
 */
export function generateDungeon(seed: number, size = DUNGEON_SIZE): DungeonLayout {
  const rng = createRandom(seed);
  const placement = placeRooms(rng, size);

  if (!placement.ok) {
    throw new Error(`Dungeon generation failed for seed ${seed}: ${placement.reason}`);
  }

  const rooms = placement.rooms;
  const { floorCells } = carveCorridors(rooms, rng, size);

  if (!isFullyConnected(floorCells, size, rooms[0].center)) {
    throw new Error(`Dungeon floor is disconnected for seed ${seed}`);
  }

  const { wallCells, wallRuns } = generateWalls(floorCells, size);

  const spawnCell = rooms[0].center;
  const spawn: Position = {
    x: spawnCell.x - (size - 1) / 2,
    y: FLOOR_TOP,
    z: spawnCell.z - (size - 1) / 2,
  };

  return { seed, size, rooms, floorCells, wallCells, wallRuns, spawn };
}
