/**
 * Diorama look constants. Keep every visual tweak here so the effects,
 * camera, and lighting can be tuned in one place instead of across components.
 * Values are constants only: nothing in this file is animated or stored in
 * React state.
 */

export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 120;

/**
 * High-tier depth of field. The orthographic camera sits about 34.6 world
 * units from the hero, so a narrow focus range leaves the knight and the tiles
 * around him sharp while the far board softens like a macro lens.
 */
export const DEPTH_OF_FIELD = {
  bokehScale: 4,
  focusRange: 2.6,
  resolutionScale: 0.5,
} as const;

/** Height above the hero's feet that the autofocus tracks. */
export const AUTOFOCUS_HEIGHT = 0.55;

/** Low-tier tilt-shift. Cheap two-pass blur with a strong vertical band. */
export const TILT_SHIFT = {
  blur: 0.55,
  taper: 0.55,
  start: [0, 0.28] as [number, number],
  end: [1, 0.78] as [number, number],
  samples: 8,
} as const;

/**
 * Diablo-style edge fade. The center stays readable while the corners fall to
 * near black.
 */
export const VIGNETTE = {
  offset: 0.5,
  darkness: 0.9,
} as const;

/** Floor jitter bounds, shared by the instancing and blob-shadow modules. */
export const FLOOR_MAX_JITTER = 0.05;
export const FLOOR_TILT_RANGE = 0.02;
export const WALL_SCALE_RANGE = 0.03;
export const WALL_LEAN_RANGE = 0.01;
