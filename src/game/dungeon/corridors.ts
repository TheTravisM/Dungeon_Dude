import type { DungeonRoom, GridCell } from '../../types';
import { DUNGEON_CORRIDOR_WIDTH, DUNGEON_MARGIN, DUNGEON_SIZE } from './constants';
import { CARDINAL_DIRECTIONS, findGridPath } from './pathfinding';
import type { RandomSource } from './random';

export interface CorridorConnection {
  /** Index of the room already in the connected set. */
  from: number;
  /** Index of the room newly joined to the graph. */
  to: number;
  kind: 'tree' | 'loop';
}

export interface CorridorCarveResult {
  /** Unique room and corridor cells in stable row-major order. */
  floorCells: GridCell[];
  /** Only the carved corridor cells, in stable row-major order. */
  corridorCells: GridCell[];
  /** Spanning-tree edges plus at most one optional loop. */
  connections: CorridorConnection[];
}

function manhattan(a: GridCell, b: GridCell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

/** True when a cell is inside the room rectangle expanded by one tile. */
function insideBuffer(room: DungeonRoom, x: number, z: number): boolean {
  return (
    x >= room.x - 1 &&
    x < room.x + room.width + 1 &&
    z >= room.z - 1 &&
    z < room.z + room.depth + 1
  );
}

/**
 * Connects rooms with one-tile corridors using a deterministic spanning tree
 * and at most one optional loop. Routes use a bounded breadth-first search that
 * treats every other room and its one-tile buffer as blocked. This prevents a
 * corridor from cutting through an unrelated room or running alongside it and
 * creating an unintended doorway.
 */
export function carveCorridors(
  rooms: readonly DungeonRoom[],
  rng: RandomSource,
  size: number = DUNGEON_SIZE
): CorridorCarveResult {
  const mask = new Uint8Array(size * size);
  const roomMask = new Uint8Array(size * size);
  const corridorMask = new Uint8Array(size * size);

  const inBounds = (x: number, z: number) => x >= 0 && z >= 0 && x < size && z < size;
  const index = (x: number, z: number) => z * size + x;

  const carve = (x: number, z: number, corridor: boolean) => {
    if (!inBounds(x, z)) return;
    const cellIndex = index(x, z);
    mask[cellIndex] = 1;
    if (!corridor) {
      roomMask[cellIndex] = 1;
    } else if (roomMask[cellIndex] !== 1) {
      corridorMask[cellIndex] = 1;
    }
  };

  for (const room of rooms) {
    for (let z = room.z; z < room.z + room.depth; z++) {
      for (let x = room.x; x < room.x + room.width; x++) carve(x, z, false);
    }
  }

  if (rooms.length === 0) {
    return { floorCells: [], corridorCells: [], connections: [] };
  }

  const min = DUNGEON_MARGIN;
  const max = size - DUNGEON_MARGIN - 1;
  // A per-layout rotation keeps routes deterministic while varying which
  // shortest path the breadth-first search prefers.
  const rotation = rng.int(0, CARDINAL_DIRECTIONS.length - 1);
  const directions = [
    ...CARDINAL_DIRECTIONS.slice(rotation),
    ...CARDINAL_DIRECTIONS.slice(0, rotation),
  ];

  const isAllowed = (x: number, z: number, fromRoom: number, toRoom: number) => {
    if (x < min || z < min || x > max || z > max) return false;

    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      if (roomIndex === fromRoom || roomIndex === toRoom) continue;
      if (insideBuffer(rooms[roomIndex], x, z)) return false;
    }
    return true;
  };

  /** Deterministic obstacle-aware route between two room centers. */
  const findPath = (fromRoom: number, toRoom: number): GridCell[] | null =>
    findGridPath({
      size,
      start: rooms[fromRoom].center,
      goal: rooms[toRoom].center,
      canEnter: (x, z) => isAllowed(x, z, fromRoom, toRoom),
      directions,
    });

  /** The first route is the spanning-tree edge; the second, if any, is the loop. */
  const treeEdges = new Set<string>();
  const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  const carvePath = (path: GridCell[]) => {
    for (const cell of path) {
      for (let offset = 0; offset < DUNGEON_CORRIDOR_WIDTH; offset++) {
        carve(cell.x, cell.z + offset, true);
      }
    }
  };

  const connected: number[] = [0];
  const remaining = rooms.map((_, roomIndex) => roomIndex).slice(1);
  const connections: CorridorConnection[] = [];

  while (remaining.length > 0) {
    let bestFrom = -1;
    let bestTo = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPath: GridCell[] | null = null;

    for (const to of remaining) {
      for (const from of connected) {
        const distance = manhattan(rooms[from].center, rooms[to].center);
        const better =
          distance < bestDistance ||
          (distance === bestDistance &&
            (to < bestTo || (to === bestTo && from < bestFrom)));
        if (!better) continue;

        const path = findPath(from, to);
        if (!path) continue;

        bestDistance = distance;
        bestFrom = from;
        bestTo = to;
        bestPath = path;
      }
    }

    if (!bestPath) {
      throw new Error(`Unable to connect all ${rooms.length} rooms with corridors`);
    }

    carvePath(bestPath);
    treeEdges.add(edgeKey(bestFrom, bestTo));
    connected.push(bestTo);
    remaining.splice(remaining.indexOf(bestTo), 1);
    connections.push({ from: bestFrom, to: bestTo, kind: 'tree' });
  }

  // Optional loop: try the longest non-tree pair first, then shorter pairs,
  // stopping after the first pair that has a valid obstacle-free route.
  const loopCandidates: Array<{ from: number; to: number; distance: number }> = [];
  for (let from = 0; from < rooms.length; from++) {
    for (let to = from + 1; to < rooms.length; to++) {
      if (treeEdges.has(edgeKey(from, to))) continue;
      loopCandidates.push({
        from,
        to,
        distance: manhattan(rooms[from].center, rooms[to].center),
      });
    }
  }
  loopCandidates.sort(
    (a, b) => b.distance - a.distance || a.from - b.from || a.to - b.to
  );

  for (const candidate of loopCandidates) {
    const path = findPath(candidate.from, candidate.to);
    if (!path) continue;
    carvePath(path);
    connections.push({ from: candidate.from, to: candidate.to, kind: 'loop' });
    break;
  }

  const floorCells: GridCell[] = [];
  const corridorCells: GridCell[] = [];
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const cellIndex = index(x, z);
      if (mask[cellIndex] === 1) floorCells.push({ x, z });
      if (corridorMask[cellIndex] === 1) corridorCells.push({ x, z });
    }
  }

  return { floorCells, corridorCells, connections };
}
