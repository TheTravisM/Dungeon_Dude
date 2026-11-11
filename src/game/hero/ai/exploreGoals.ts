import type { DungeonLayout, GridCell } from '../../../types';
import { gridToWorld, worldToGrid } from '../../dungeon/constants';
import type { RandomSource } from '../../dungeon/random';
import { planWorldPath, type WorldPoint } from '../navigation/heroPath';
import type { WalkGrid } from '../navigation/walkGrid';

/** Rooms already visited during the current exploration sweep. */
export interface ExploreState {
  visited: Set<number>;
  lastGoalRoom: number | null;
}

/** Minimum grid distance for a last-resort wander target. */
const WANDER_MIN_DISTANCE = 4;

export function createExploreState(): ExploreState {
  return { visited: new Set(), lastGoalRoom: null };
}

function roomCenterWorld(layout: DungeonLayout, roomIndex: number): WorldPoint {
  const center = layout.rooms[roomIndex].center;
  return {
    x: gridToWorld(center.x, layout.size),
    z: gridToWorld(center.z, layout.size),
  };
}

/** Returns the room containing a world point, or null when it is in a corridor. */
export function roomIndexAt(layout: DungeonLayout, p: WorldPoint): number | null {
  const x = worldToGrid(p.x, layout.size);
  const z = worldToGrid(p.z, layout.size);

  for (let index = 0; index < layout.rooms.length; index++) {
    const room = layout.rooms[index];
    if (
      x >= room.x &&
      x < room.x + room.width &&
      z >= room.z &&
      z < room.z + room.depth
    ) {
      return index;
    }
  }
  return null;
}

export function markVisited(state: ExploreState, roomIndex: number): void {
  state.visited.add(roomIndex);
}

function unvisitedRooms(
  layout: DungeonLayout,
  state: ExploreState,
  currentRoom: number | null
): number[] {
  const rooms: number[] = [];
  for (let index = 0; index < layout.rooms.length; index++) {
    if (index === currentRoom) continue;
    if (state.visited.has(index)) continue;
    rooms.push(index);
  }
  return rooms;
}

/**
 * Picks the closest unvisited room. When a sweep is exhausted the visited set
 * is reset except for the room the hero stands in, so exploration continues
 * forever instead of stalling. Ties are broken with the supplied rng, which
 * keeps the choice deterministic for a fixed seed.
 */
export function pickNextRoom(
  layout: DungeonLayout,
  grid: WalkGrid,
  state: ExploreState,
  from: WorldPoint,
  rng: RandomSource
): number | null {
  if (layout.rooms.length === 0) return null;

  const currentRoom = roomIndexAt(layout, from);

  // A single-room floor can only ever revisit the room it is already in.
  if (layout.rooms.length === 1) {
    const room = layout.rooms[0];
    if (!grid.isWalkable(room.center.x, room.center.z)) return null;
    return planWorldPath(layout, from, roomCenterWorld(layout, 0)) ? 0 : null;
  }

  let candidates = unvisitedRooms(layout, state, currentRoom);
  if (candidates.length === 0) {
    // Sweep complete: keep only the current room marked and start again.
    state.visited.clear();
    if (currentRoom !== null) state.visited.add(currentRoom);
    candidates = unvisitedRooms(layout, state, currentRoom);
  }

  const reachable: Array<{ index: number; length: number }> = [];
  for (const index of candidates) {
    const center = layout.rooms[index].center;
    if (!grid.isWalkable(center.x, center.z)) continue;

    const path = planWorldPath(layout, from, roomCenterWorld(layout, index));
    if (path) reachable.push({ index, length: path.length });
  }
  if (reachable.length === 0) return null;

  const shortest = Math.min(...reachable.map((room) => room.length));
  const tied = reachable
    .filter((room) => room.length === shortest)
    .map((room) => room.index);

  const chosen = rng.pick(tied);
  state.lastGoalRoom = chosen;
  return chosen;
}

/**
 * Picks a random walkable cell at least four grid steps away. This is the
 * last-resort goal after repeated failures, so it relaxes the distance rule
 * only when the floor has no far-enough cell at all.
 */
export function pickWanderCell(
  grid: WalkGrid,
  layout: DungeonLayout,
  from: WorldPoint,
  rng: RandomSource
): GridCell | null {
  const fromX = worldToGrid(from.x, layout.size);
  const fromZ = worldToGrid(from.z, layout.size);

  const far: GridCell[] = [];
  const any: GridCell[] = [];

  for (const cell of layout.floorCells) {
    if (!grid.isWalkable(cell.x, cell.z)) continue;
    if (cell.x === fromX && cell.z === fromZ) continue;

    any.push(cell);
    const distance = Math.abs(cell.x - fromX) + Math.abs(cell.z - fromZ);
    if (distance >= WANDER_MIN_DISTANCE) far.push(cell);
  }

  const pool = far.length > 0 ? far : any;
  if (pool.length === 0) return null;

  const cell = rng.pick(pool);
  return { x: cell.x, z: cell.z };
}
