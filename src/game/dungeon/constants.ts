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
export const DUNGEON_ROOM_MIN = 4;
export const DUNGEON_ROOM_MAX = 6;

/** The start room is larger and centered on the spawn point. */
export const DUNGEON_START_ROOM_MIN = 5;
export const DUNGEON_START_ROOM_MAX = 7;

/** Later rooms stay smaller so they fit around the start room. */
export const DUNGEON_ROOM_MIN_SIZE = 3;
export const DUNGEON_ROOM_MAX_SIZE = 5;

/** Keep one empty tile between rooms so their walls stay readable. */
export const DUNGEON_ROOM_SPACING = 1;

/** Upper bound for rejected random placements before the generator retries. */
export const DUNGEON_ROOM_MAX_ATTEMPTS = 100;

/**
 * Corridors are one tile wide. The Step 5 hero capsule and character-controller
 * offset must stay within one half tile so the hero can clear every corridor.
 */
export const DUNGEON_CORRIDOR_WIDTH = 1;

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

/** Lip beyond the 20 by 20 grid on each side. */
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
