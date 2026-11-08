/**
 * Visual and collision dimensions for the dungeon diorama. These live apart
 * from the generator because the generator only needs grid coordinates; the
 * renderer and the collider both need the physical sizes and must agree.
 */

export const DUNGEON_SIZE = 20;

/** Outer ring kept solid so the diorama always has a closed silhouette. */
export const DUNGEON_MARGIN = 1;

/** Top of the carved floor tiles. Everything walkable sits at this height. */
export const FLOOR_TOP = 0.06;

export const FLOOR_TILE_HEIGHT = 0.06;

/** Small gap between floor plates so individual tiles stay readable. */
export const FLOOR_TILE_INSET = 0.03;

export const WALL_HEIGHT_TALL = 2.2;
export const WALL_HEIGHT_LOW = 0.75;

/** Height of the solid stone block the diorama sits on. */
export const PLINTH_HEIGHT = 0.8;

/** Collision slab under the whole grid. It only needs to stop falling bodies. */
export const FLOOR_COLLIDER_THICKNESS = 0.4;

/** Target room count. The first room is always centered on the spawn point. */
export const DUNGEON_ROOM_TARGET = 4;
