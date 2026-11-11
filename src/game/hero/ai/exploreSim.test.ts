import { describe, expect, it } from 'vitest';
import { PHYSICS_TIME_STEP } from '../../constants';
import { gridToWorld, worldToGrid } from '../../dungeon/constants';
import { generateDungeon } from '../../dungeon/generateDungeon';
import { createRandom } from '../../dungeon/random';
import { HERO_SPEED, HERO_WAYPOINT_REACH } from '../constants';
import {
  createExploreState,
  markVisited,
  pickNextRoom,
} from './exploreGoals';
import type { DungeonLayout } from '../../../types';
import { planWorldPath, type WorldPoint } from '../navigation/heroPath';
import { directionToWaypoint } from '../navigation/route';
import { smoothPath } from '../navigation/smoothPath';
import { createWalkGrid } from '../navigation/walkGrid';

/**
 * Headless proof that the brain's exploration loop always terminates. A point
 * mass moves at `HERO_SPEED` in 60 Hz steps using the same pure modules the
 * behavior tree calls: `pickNextRoom`, `planWorldPath`, `smoothPath`, and
 * `directionToWaypoint`. No React, Rapier, or route singleton is involved.
 *
 * Budget is one simulated minute per room, which is far more than a hero needs
 * on a 20 by 20 floor and still catches a goal that can never be reached.
 */

const SEEDS = Array.from({ length: 50 }, (_, index) => index + 1);
const SECONDS_PER_ROOM = 60;

interface SimResult {
  seed: number;
  visited: number;
  totalRooms: number;
  budget: number;
  /** Step index where the point left the walkable floor, if any. */
  offGridStep: number | null;
}

function worldOfGrid(x: number, z: number, size: number): WorldPoint {
  return { x: gridToWorld(x, size), z: gridToWorld(z, size) };
}

function withinReach(pos: WorldPoint, waypoint: WorldPoint): boolean {
  return Math.hypot(waypoint.x - pos.x, waypoint.z - pos.z) <= HERO_WAYPOINT_REACH;
}

function simulate(seed: number): SimResult {
  const layout: DungeonLayout = generateDungeon(seed);
  const grid = createWalkGrid(layout);
  const rng = createRandom(seed ^ 0x9e3779b9);
  const explore = createExploreState();

  const maxSteps = SECONDS_PER_ROOM * 60 * layout.rooms.length;
  const stepDistance = HERO_SPEED * PHYSICS_TIME_STEP;
  const visited = new Set<number>();

  const position: WorldPoint = { x: layout.spawn.x, z: layout.spawn.z };
  let route: WorldPoint[] = [];
  let goalRoom = -1;
  let offGridStep: number | null = null;

  for (let step = 0; step < maxSteps; step++) {
    if (visited.size === layout.rooms.length) break;

    if (route.length === 0) {
      const next = pickNextRoom(layout, grid, explore, position, rng);
      if (next === null) {
        throw new Error(`Seed ${seed}: no room was reachable from step ${step}`);
      }

      const room = layout.rooms[next];
      const goal = worldOfGrid(room.center.x, room.center.z, layout.size);
      const raw = planWorldPath(layout, position, goal);
      if (raw === null) {
        throw new Error(`Seed ${seed}: route to room ${next} was null at step ${step}`);
      }

      route = smoothPath(grid, position, raw);
      if (route.length === 0) {
        throw new Error(`Seed ${seed}: smoothing emptied the route to room ${next}`);
      }
      goalRoom = next;
    }

    const cellX = worldToGrid(position.x, layout.size);
    const cellZ = worldToGrid(position.z, layout.size);
    if (!grid.isWalkable(cellX, cellZ)) {
      offGridStep = step;
      break;
    }

    // Mirror `resolveHeroDirection`: consume reached waypoints before asking
    // for a direction. Without consumption the point oscillates around a
    // waypoint because a 0.05 step can overshoot the 0.12 reach radius.
    while (route.length > 0 && withinReach(position, route[0])) {
      route.shift();
    }

    if (route.length === 0) {
      markVisited(explore, goalRoom);
      visited.add(goalRoom);
      continue;
    }

    const { dir } = directionToWaypoint(position, route);
    position.x += dir.x * stepDistance;
    position.z += dir.z * stepDistance;
  }

  return {
    seed,
    visited: visited.size,
    totalRooms: layout.rooms.length,
    budget: maxSteps,
    offGridStep,
  };
}

describe('headless exploration', () => {
  it('visits every room on seeds 1 to 50 without leaving the floor', () => {
    const failures: string[] = [];

    for (const seed of SEEDS) {
      const result = simulate(seed);

      if (result.offGridStep !== null) {
        failures.push(`seed ${seed}: left walkable floor at step ${result.offGridStep}`);
        continue;
      }

      if (result.visited !== result.totalRooms) {
        failures.push(
          `seed ${seed}: visited ${result.visited}/${result.totalRooms} rooms ` +
            `within ${result.budget} steps`
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
