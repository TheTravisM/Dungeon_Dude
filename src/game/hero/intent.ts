import { HERO_WAYPOINT_REACH } from './constants';
import { inputState, isManualNow } from './input/inputState';
import { axesToWorldDirection } from './isoMovement';
import type { WorldPoint } from './navigation/heroPath';
import { directionToWaypoint } from './navigation/route';
import { clearRoute, routeState, setRoute } from './navigation/routeState';

/** Tracks the manual/auto transition so the route is cleared exactly once. */
let wasManual = false;

function withinReach(pos: WorldPoint, waypoint: WorldPoint): boolean {
  return (
    Math.hypot(waypoint.x - pos.x, waypoint.z - pos.z) <= HERO_WAYPOINT_REACH
  );
}

/**
 * Resolves the hero's desired direction for this physics step. Manual input
 * always wins: entering manual mode drops any autonomous route, and while the
 * manual window is active the hero follows the axes even when they are zero.
 * In auto mode the active route is followed, consuming reached waypoints.
 */
export function resolveHeroDirection(
  nowMs: number,
  pos: WorldPoint
): { x: number; z: number } {
  if (isManualNow(nowMs)) {
    if (!wasManual) clearRoute();
    wasManual = true;
    return axesToWorldDirection(inputState.axes);
  }

  wasManual = false;

  const points = routeState.points;
  let consumed = 0;
  while (consumed < points.length && withinReach(pos, points[consumed])) {
    consumed += 1;
  }
  if (consumed > 0) {
    // One write per consumption keeps the debug overlay's version meaningful.
    setRoute(points.slice(consumed), routeState.goal);
  }

  return directionToWaypoint(pos, routeState.points).dir;
}
