/**
 * Shared world constants. Visual meshes and physics colliders both read from
 * these values so the rendered floor and its collision shape cannot drift.
 */

/** One unit equals one dungeon tile. */
export const FLOOR_SIZE = 20;

/** The visual floor is a slab; its top surface sits at world y = 0. */
export const FLOOR_THICKNESS = 0.5;

/** Fixed physics timestep keeps simulation behavior stable across frame rates. */
export const PHYSICS_TIME_STEP = 1 / 60;

/** Standard gravity in world units per second squared. */
export const GRAVITY: [number, number, number] = [0, -9.81, 0];
