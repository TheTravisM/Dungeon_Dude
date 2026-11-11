/**
 * Screen-space input axes. `x` is right-positive, `y` is forward-positive
 * (screen up), matching what a player sees rather than world coordinates.
 */
export interface Axes {
  x: number;
  y: number;
}

const DIAGONAL = Math.SQRT1_2;

/**
 * Converts screen axes into a normalized world-space direction on the XZ plane.
 *
 * The fixed isometric camera is rotated 45 degrees, so screen up is
 * `(-0.7071, -0.7071)` and screen right is `(+0.7071, -0.7071)` in `(x, z)`.
 * Zero input stays zero; every nonzero input is normalized to unit length.
 */
export function axesToWorldDirection(axes: Axes): { x: number; z: number } {
  const x = axes.x * DIAGONAL - axes.y * DIAGONAL;
  const z = -axes.x * DIAGONAL - axes.y * DIAGONAL;
  const length = Math.hypot(x, z);

  if (length === 0) return { x: 0, z: 0 };
  return { x: x / length, z: z / length };
}
