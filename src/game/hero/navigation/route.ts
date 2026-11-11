import { HERO_WAYPOINT_REACH } from '../constants';
import type { WorldPoint } from './heroPath';

/** Unit direction toward the first waypoint that is still out of reach. */
export interface WaypointDirection {
  dir: { x: number; z: number };
  arrived: boolean;
}

/**
 * Pure waypoint lookup. Leading waypoints already inside `reach` are skipped,
 * and the returned direction is a unit vector toward the first remaining one.
 * When nothing remains the hero has arrived and the direction is zero. The
 * caller owns removing consumed waypoints from the live route.
 */
export function directionToWaypoint(
  pos: WorldPoint,
  waypoints: WorldPoint[],
  reach: number = HERO_WAYPOINT_REACH
): WaypointDirection {
  for (const waypoint of waypoints) {
    const dx = waypoint.x - pos.x;
    const dz = waypoint.z - pos.z;
    const distance = Math.hypot(dx, dz);

    if (distance > reach) {
      return { dir: { x: dx / distance, z: dz / distance }, arrived: false };
    }
  }

  return { dir: { x: 0, z: 0 }, arrived: true };
}
