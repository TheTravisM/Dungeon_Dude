/**
 * Writes the unit vector pointing away from the source, into `out`. A zero
 * length falls back to +Z so a hit from the same point still moves visibly.
 */
export function knockbackDirection(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  out: { x: number; z: number }
): { x: number; z: number } {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const length = Math.hypot(dx, dz);
  if (length <= 1e-6) {
    out.x = 0;
    out.z = 1;
    return out;
  }
  out.x = dx / length;
  out.z = dz / length;
  return out;
}

/** Linear fade from 1 at the start of knockback to 0 at its end. */
export function knockbackFactor(
  nowMs: number,
  untilMs: number,
  durationMs: number
): number {
  if (durationMs <= 0) return 0;
  const remaining = untilMs - nowMs;
  if (remaining <= 0) return 0;
  return Math.min(1, remaining / durationMs);
}
