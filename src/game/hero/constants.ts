/**
 * Hero tuning constants shared by physics, movement, camera, and AI.
 *
 * Corridors are one tile wide, so the radius plus controller offset must stay
 * at or below 0.5 to leave clearance on both sides.
 */
export const HERO_RADIUS = 0.28;
export const HERO_HEIGHT = 1.05;
export const HERO_CAPSULE_HALF_HEIGHT = (HERO_HEIGHT - 2 * HERO_RADIUS) / 2;
export const HERO_GROUND_CLEARANCE = 0.02;

/**
 * The body origin sits at the hero's feet (`layout.spawn.y`), so the capsule
 * collider is raised by this amount to rest just above `FLOOR_TOP`.
 */
export const HERO_CAPSULE_CENTER_Y =
  HERO_GROUND_CLEARANCE + HERO_CAPSULE_HALF_HEIGHT + HERO_RADIUS;

/** Rapier character-controller skin gap. */
export const HERO_CONTROLLER_OFFSET = 0.02;

/** Walk speed in world units per second. */
export const HERO_SPEED = 3.0;

/** The ONLY place the four-second manual-to-auto rule lives. */
export const HERO_IDLE_RETURN_MS = 4000;

/** Approved 4 to 10 Hz behavior-tree band. */
export const HERO_BRAIN_HZ = 5;

/** Distance at which a waypoint counts as reached. */
export const HERO_WAYPOINT_REACH = 0.12;

/** Stuck detection window and minimum progress within it. */
export const HERO_STUCK_WINDOW_MS = 1000;
export const HERO_STUCK_MIN_PROGRESS = 0.3;

/** Smoothing sweep radius used when validating shortened paths. */
export const HERO_PATH_CLEARANCE = 0.32;

/** Left-stick deadzone for the native gamepad poll. */
export const GAMEPAD_DEADZONE = 0.25;

/** One sword swing: wind-up, hit window, and recovery, all in milliseconds. */
export const HERO_ATTACK_WINDUP_MS = 120;
export const HERO_ATTACK_ACTIVE_MS = 140;
export const HERO_ATTACK_RECOVERY_MS = 260;
/** Tiles, center to center; the sword sensor in 06-07 uses this. */
export const HERO_ATTACK_REACH = 1.15;
/** Tiles; auto mode starts fighting inside this. */
export const HERO_ENGAGE_RANGE = 2.6;
/** How long a combat intent stays valid without a refresh. */
export const HERO_COMBAT_HOLD_MS = 300;
