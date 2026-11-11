import type { WorldPoint } from './heroPath';

/** The hero's remaining smoothed waypoints and the goal they lead to. */
export interface RouteState {
  points: WorldPoint[];
  goal: WorldPoint | null;
  /** Bumped on every set/clear so debug views can rebuild only on change. */
  version: number;
}

/**
 * Module singleton for the active route. Route planning and following run
 * outside React, so the route lives here rather than in Zustand or component
 * state. The version counter is the only change signal debug views need.
 */
export const routeState: RouteState = {
  points: [],
  goal: null,
  version: 0,
};

/** Replaces the route and signals debug consumers that it changed. */
export function setRoute(points: WorldPoint[], goal: WorldPoint | null): void {
  routeState.points = points;
  routeState.goal = goal;
  routeState.version += 1;
}

/** Drops the route and signals debug consumers that it changed. */
export function clearRoute(): void {
  routeState.points = [];
  routeState.goal = null;
  routeState.version += 1;
}
