/**
 * Single source of truth for the fixed isometric view. CameraFollow keeps the
 * offset and angle constant while moving the focus with the hero, and
 * IsometricCamera/App use the same numbers for their initial setup.
 */

/** Camera position relative to its focus point. */
export const CAMERA_OFFSET: [number, number, number] = [20, 20, 20];

/** Orthographic zoom. The hero is about 67 px tall at 64. */
export const CAMERA_ZOOM = 64;

/**
 * Flip this to true while tuning the scene. Orbit controls would fight the
 * fixed game camera during normal play, so CameraFollow disables itself while
 * this is on.
 */
export const DEBUG_ORBIT_CONTROLS = false;
