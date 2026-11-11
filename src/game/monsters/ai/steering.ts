export const SEPARATION_RADIUS = 0.7;

/**
 * Aggro needs both proximity and a route that is not much longer than the
 * straight line, so a wall between rooms blocks it without raycasts.
 */
export function aggroAllowed(
  straightDist: number,
  routeLength: number,
  aggroRange: number
): boolean {
  return (
    straightDist <= aggroRange &&
    routeLength <= aggroRange * 1.6 + 1
  );
}

/**
 * Repulsion away from nearby neighbors, capped at unit length. Writes into and
 * returns `out`; allocates nothing.
 */
export function separationVector(
  x: number,
  z: number,
  self: unknown,
  neighbors: readonly { position?: { x: number; z: number } }[],
  out: { x: number; z: number }
): { x: number; z: number } {
  let sx = 0;
  let sz = 0;

  for (const other of neighbors) {
    if (other === self || !other.position) continue;
    const dx = x - other.position.x;
    const dz = z - other.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > SEPARATION_RADIUS) continue;
    const scale = 1 / Math.max(distance * distance, 0.01);
    sx += dx * scale;
    sz += dz * scale;
  }

  const length = Math.hypot(sx, sz);
  if (length > 1) {
    sx /= length;
    sz /= length;
  }

  out.x = sx;
  out.z = sz;
  return out;
}
