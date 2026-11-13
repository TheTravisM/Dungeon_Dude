import { FLOOR_SIZE } from '../constants';

/**
 * Approved dungeon configuration. The generator works in grid coordinates and
 * must not invent sizes of its own; renderers and colliders read the same
 * values so a generated layout cannot drift from its visible or physical form.
 */

/** The playable grid is derived from the shared floor constant. */
export const DUNGEON_SIZE = FLOOR_SIZE;

/** One world unit represents one dungeon tile. */
export const DUNGEON_TILE_SIZE = 1;

/** Outer ring kept solid so the diorama always has a closed silhouette. */
export const DUNGEON_MARGIN = 1;

/** Depth one uses this seed so the first floor is reproducible by name. */
export const DUNGEON_DEFAULT_SEED = 1337;

/** Per-seed room target range. The minimum fallback still applies. */
export const DUNGEON_ROOM_MIN = 16;
export const DUNGEON_ROOM_MAX = 22;

/** The start room is larger and centered on the spawn point. */
export const DUNGEON_START_ROOM_MIN = 8;
export const DUNGEON_START_ROOM_MAX = 11;

/** Later rooms vary in size so halls and chambers do not read as a grid. */
export const DUNGEON_ROOM_MIN_SIZE = 4;
export const DUNGEON_ROOM_MAX_SIZE = 8;

/** Keep two empty tiles between rooms so two-tile halls never hug a wall. */
export const DUNGEON_ROOM_SPACING = 2;

/** Upper bound for rejected random placements before the generator retries. */
export const DUNGEON_ROOM_MAX_ATTEMPTS = 900;

/**
 * Hallways are two tiles wide, which leaves room for the hero capsule, props,
 * and monsters to pass without the camera feeling pinched.
 */
export const DUNGEON_CORRIDOR_WIDTH = 2;

/** Top of the carved floor tiles. Everything walkable sits at this height. */
export const FLOOR_TOP = 0.06;

export const FLOOR_TILE_HEIGHT = 0.06;

/** Small gap between floor plates so individual tiles stay readable. */
export const FLOOR_TILE_INSET = 0.03;

/** Wall cells occupy one grid tile. */
export const WALL_THICKNESS = DUNGEON_TILE_SIZE;

export const WALL_HEIGHT_TALL = 2.2;
export const WALL_HEIGHT_LOW = 0.6;

/** Height of the solid stone block the diorama sits on. */
export const PLINTH_HEIGHT = 0.8;

/** Lip beyond the playable grid on each side. */
export const PLINTH_OVERHANG = 0.4;

export const PLINTH_SIZE = DUNGEON_SIZE + PLINTH_OVERHANG * 2;

/** Width of the contrasting trim around the plinth top edge. */
export const PLINTH_TRIM_WIDTH = 0.15;

/** Collision slab under the whole grid. It only needs to stop falling bodies. */
export const FLOOR_COLLIDER_THICKNESS = 0.4;

/**
 * Converts a zero-indexed grid coordinate to the world-space center of that
 * cell. An even-sized grid sits half a unit off the origin, which is expected;
 * every renderer and collider uses this one transform so they cannot drift.
 */
export function gridToWorld(coordinate: number, size: number = DUNGEON_SIZE): number {
  return coordinate - (size - 1) / 2;
}

/** Converts a world coordinate back to its containing zero-indexed grid cell. */
export function worldToGrid(coordinate: number, size: number = DUNGEON_SIZE): number {
  return Math.round(coordinate + (size - 1) / 2);
}
