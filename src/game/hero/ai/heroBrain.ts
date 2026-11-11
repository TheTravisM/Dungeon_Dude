import { BehaviourTree, State } from 'mistreevous';
import type { DungeonLayout } from '../../../types';
import { gridToWorld } from '../../dungeon/constants';
import { createRandom } from '../../dungeon/random';
import { heroCombat, resetCombat } from '../combat/combatIntent';
import { planWorldPath, type WorldPoint } from '../navigation/heroPath';
import { clearRoute, routeState, setRoute } from '../navigation/routeState';
import { smoothPath } from '../navigation/smoothPath';
import { createWalkGrid } from '../navigation/walkGrid';
import { createHeroCombatActions } from './heroCombatActions';
import { createExploreState, markVisited, pickNextRoom, pickWanderCell, roomIndexAt } from './exploreGoals';
import { createStuckDetector } from './stuckDetector';

/**
 * The autonomous hero tree. Combat is the top priority, then exploration.
 * Every action is instant so earlier conditions can be re-evaluated each tick.
 */
export const HERO_TREE = `
root {
  selector {
    sequence { condition [EnemyInReach] action [Fight] }
    sequence { condition [HasRoute]     action [TrackRoute] }
    action [PlanNext]
  }
}
`;

/** After this many consecutive planning failures the next goal is a wander cell. */
const WANDER_AFTER_FAILURES = 2;

export interface HeroBrain {
  tick(nowMs: number): void;
  onManualTakeover(nowMs: number): void;
}

function roomCenterWorld(layout: DungeonLayout, roomIndex: number): WorldPoint {
  const center = layout.rooms[roomIndex].center;
  return { x: gridToWorld(center.x, layout.size), z: gridToWorld(center.z, layout.size) };
}

/**
 * Framework-free autonomous brain. It owns exploration bookkeeping, route
 * planning, and stuck recovery, and writes only the module-level route. One
 * tree step is intended per brain tick; the caller controls that clock.
 */
export function createHeroBrain(
  layout: DungeonLayout,
  getPosition: () => WorldPoint,
  requestSnap: () => void
): HeroBrain {
  const rng = createRandom(layout.seed ^ 0x9e3779b9);
  const grid = createWalkGrid(layout);
  const explore = createExploreState();
  const stuck = createStuckDetector();
  const combat = createHeroCombatActions(
    grid,
    getPosition,
    () => nowMs,
    (now, position) => stuck.reset(now, position)
  );

  let nowMs = 0;
  let planFailures = 0;
  let skipGoalRoom = false;

  function planToGoal(goal: WorldPoint): boolean {
    const from = getPosition();
    const raw = planWorldPath(layout, from, goal);
    if (!raw) return false;

    const points = smoothPath(grid, from, raw);
    if (points.length === 0) return false;

    setRoute(points, goal);
    return true;
  }

  function HasRoute(): boolean {
    return routeState.points.length > 0;
  }

  function TrackRoute(): State {
    heroCombat.engaged = false;

    if (routeState.points.length === 0) {
      // The route was consumed: the goal room is now visited.
      const goal = routeState.goal;
      const room = goal
        ? roomIndexAt(layout, goal)
        : roomIndexAt(layout, getPosition());
      if (room !== null) markVisited(explore, room);
      return State.SUCCEEDED;
    }

    const level = stuck.sample(nowMs, getPosition(), true);

    if (level === 1) {
      // Replan to the same goal without resetting the detector, so a real
      // problem still escalates next window.
      const goal = routeState.goal;
      if (goal && planToGoal(goal)) return State.SUCCEEDED;

      skipGoalRoom = true;
      return State.FAILED;
    }

    if (level === 2) {
      // Let PlanNext choose a different goal in the same tick.
      skipGoalRoom = true;
      return State.FAILED;
    }

    if (level === 3) {
      requestSnap();
      clearRoute();
      stuck.reset(nowMs, getPosition());
      return State.FAILED;
    }

    return State.SUCCEEDED;
  }

  function PlanNext(): State {
    heroCombat.engaged = false;
    const from = getPosition();

    // A very short route can be consumed before TrackRoute ever runs, so credit
    // a completed goal room here too. Marking is idempotent.
    if (routeState.points.length === 0 && routeState.goal) {
      const completedRoom = roomIndexAt(layout, routeState.goal);
      if (completedRoom !== null) markVisited(explore, completedRoom);
    }

    if (skipGoalRoom) {
      skipGoalRoom = false;
      const previousGoal = routeState.goal;
      const previousRoom = previousGoal
        ? roomIndexAt(layout, previousGoal)
        : null;
      if (previousRoom !== null) markVisited(explore, previousRoom);
    }

    if (planFailures >= WANDER_AFTER_FAILURES) {
      const cell = pickWanderCell(grid, layout, from, rng);
      if (cell) {
        const goal = {
          x: gridToWorld(cell.x, layout.size),
          z: gridToWorld(cell.z, layout.size),
        };
        if (planToGoal(goal)) {
          planFailures = 0;
          stuck.reset(nowMs, from);
          return State.SUCCEEDED;
        }
      }

      planFailures += 1;
      return State.FAILED;
    }

    const roomIndex = pickNextRoom(layout, grid, explore, from, rng);
    if (roomIndex === null) {
      planFailures += 1;
      return State.FAILED;
    }

    if (!planToGoal(roomCenterWorld(layout, roomIndex))) {
      planFailures += 1;
      return State.FAILED;
    }

    planFailures = 0;
    stuck.reset(nowMs, from);
    return State.SUCCEEDED;
  }

  const tree = new BehaviourTree(HERO_TREE, {
    EnemyInReach: combat.EnemyInReach, Fight: combat.Fight,
    HasRoute, TrackRoute, PlanNext,
  }, { random: () => rng.next() });

  return {
    tick(nextNowMs) {
      nowMs = nextNowMs;
      tree.step();
    },

    onManualTakeover(nextNowMs) {
      nowMs = nextNowMs;
      tree.reset();
      clearRoute();
      resetCombat();
      stuck.reset(nextNowMs, getPosition());
      planFailures = 0;
      skipGoalRoom = false;
    },
  };
}
