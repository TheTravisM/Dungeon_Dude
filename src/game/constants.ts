/**
 * Shared world constants. Visual meshes and physics colliders both read from
 * these values so the rendered floor and its collision shape cannot drift.
 */

/** One unit equals one dungeon tile. The playable grid is 20 by 20 tiles. */
export const FLOOR_SIZE = 20;

/** Fixed physics timestep keeps simulation behavior stable across frame rates. */
export const PHYSICS_TIME_STEP = 1 / 60;

/** Standard gravity in world units per second squared. */
export const GRAVITY: [number, number, number] = [0, -9.81, 0];
