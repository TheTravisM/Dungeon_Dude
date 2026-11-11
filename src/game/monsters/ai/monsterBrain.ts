import { BehaviourTree, State } from 'mistreevous';
import type { DungeonLayout, Entity } from '../../../types';
import { createRandom } from '../../dungeon/random';
import { createStuckDetector } from '../../hero/ai/stuckDetector';
import { HERO_PATH_CLEARANCE, HERO_WAYPOINT_REACH } from '../../hero/constants';
import { planWorldPath, type WorldPoint } from '../../hero/navigation/heroPath';
import { directionToWaypoint } from '../../hero/navigation/route';
import { hasClearLine, smoothPath } from '../../hero/navigation/smoothPath';
import type { WalkGrid } from '../../hero/navigation/walkGrid';
import { monsterIndex } from '../monsterIndex';
import { MONSTER_ARCHETYPES } from '../archetypes';
import { SEPARATION_RADIUS, aggroAllowed, separationVector } from './steering';

export const MONSTER_TREE = `root {
  selector {
    sequence { condition [HeroInAttackRange] action [HoldAndFace] }
    sequence { condition [ShouldChase]       action [Chase] }
    sequence { condition [AwayFromHome]      action [ReturnHome] }
    action [Idle]
  }
}`;

export interface MonsterBrain {
  tick(nowMs: number): void;                                   // ~5 Hz: decide
  desiredDirection(nowMs: number, out: { x: number; z: number }): void; // every physics step
}

const neighbors: Entity[] = [];
const separation = { x: 0, z: 0 };
const here = { x: 0, z: 0 };

function withinReach(pos: WorldPoint, waypoint: WorldPoint): boolean {
  return Math.hypot(waypoint.x - pos.x, waypoint.z - pos.z) <= HERO_WAYPOINT_REACH;
}

export function createMonsterBrain(
  entity: Entity,
  layout: DungeonLayout,
  grid: WalkGrid,
  getHeroPoint: () => WorldPoint | null,
  rngSeed: number
): MonsterBrain {
  const stats = MONSTER_ARCHETYPES[entity.archetype ?? 'slime'];
  const rng = createRandom(rngSeed);
  const stuck = createStuckDetector();
  const home: WorldPoint = { x: entity.position?.x ?? 0, z: entity.position?.z ?? 0 };
  let now = 0;
  let aggro = false;
  let ignoreHeroUntil = 0;
  let planFailures = 0;
  let route: WorldPoint[] = [];
  let routeTarget: 'hero' | 'home' | null = null;
  let nextPlanAt = rng.int(0, 400);

  function point(): WorldPoint {
    here.x = entity.position?.x ?? 0; here.z = entity.position?.z ?? 0; return here;
  }
  function distanceTo(target: WorldPoint): number {
    const p = point(); return Math.hypot(target.x - p.x, target.z - p.z);
  }
  function planTo(target: 'hero' | 'home', force: boolean): boolean {
    if (!force && routeTarget === target && route.length > 0 && now < nextPlanAt) {
      return true;
    }
    nextPlanAt = now + 400 + rng.int(0, 40);
    const destination = target === 'hero' ? getHeroPoint() : home;
    if (!destination) return false;
    const from = { x: point().x, z: point().z };
    const raw = planWorldPath(layout, from, destination);
    if (!raw) { planFailures += 1; return false; }
    route = smoothPath(grid, from, raw);
    routeTarget = target; planFailures = 0; return true;
  }
  function updateAggro(): void {
    const hero = getHeroPoint();
    const p = point();
    if (!hero) { aggro = false; return; }
    const straight = Math.hypot(hero.x - p.x, hero.z - p.z);
    if (aggro) {
      if (straight > stats.aggroRange * 1.6) { aggro = false; route = []; routeTarget = null; }
      return;
    }
    if (now < ignoreHeroUntil || straight > stats.aggroRange) return;
    const from = { x: p.x, z: p.z };
    const raw = planWorldPath(layout, from, hero);
    if (raw && aggroAllowed(straight, raw.length, stats.aggroRange)) {
      route = smoothPath(grid, from, raw);
      routeTarget = 'hero';
      nextPlanAt = now + 400 + rng.int(0, 40);
      planFailures = 0;
      aggro = true;
    }
  }
  function HeroInAttackRange(): boolean {
    const hero = getHeroPoint(); return hero !== null && distanceTo(hero) <= stats.attackRange;
  }

  function HoldAndFace(): State {
    entity.state = 'attack'; route = []; routeTarget = null;
    const hero = getHeroPoint();
    if (hero) { const p = point(); entity.heading = Math.atan2(hero.x - p.x, hero.z - p.z); }
    return State.SUCCEEDED;
  }
  function ShouldChase(): boolean { return aggro; }
  function Chase(): State {
    entity.state = 'chase';
    if (!planTo('hero', routeTarget !== 'hero') && planFailures >= 2) {
      aggro = false; ignoreHeroUntil = now + 3000; route = []; routeTarget = null;
    }
    return State.SUCCEEDED;
  }
  function AwayFromHome(): boolean { return distanceTo(home) > 0.25; }
  function ReturnHome(): State {
    entity.state = 'patrol'; planTo('home', routeTarget !== 'home'); return State.SUCCEEDED;
  }
  function Idle(): State {
    entity.state = 'idle'; route = []; routeTarget = null; return State.SUCCEEDED;
  }


  const tree = new BehaviourTree(
    MONSTER_TREE,
    { HeroInAttackRange, HoldAndFace, ShouldChase, Chase, AwayFromHome, ReturnHome, Idle },
    { random: () => rng.next() }
  );

  return {
    tick(nextNowMs) {
      now = nextNowMs;
      const p = point();
      const moving = entity.state === 'chase' || entity.state === 'patrol';
      const level = stuck.sample(now, p, moving);
      if (level >= 2) {
        aggro = false;
        ignoreHeroUntil = now + 3000;
        route = [];
        routeTarget = null;
        nextPlanAt = 0;
      } else if (level === 1) {
        nextPlanAt = 0;
      }
      updateAggro();
      tree.step();
    },
    desiredDirection(_nowMs, out) {
      out.x = 0;
      out.z = 0;
      const position = entity.position;
      if (!position) return;
      if (entity.state === 'attack') {
        const hero = getHeroPoint();
        if (hero) {
          entity.heading = Math.atan2(hero.x - position.x, hero.z - position.z);
        }
        return;
      }
      if (entity.state !== 'chase' && entity.state !== 'patrol') return;
      let dx = 0;
      let dz = 0;
      const p = { x: position.x, z: position.z };
      if (entity.state === 'chase') {
        const hero = getHeroPoint();
        if (hero && distanceTo(hero) <= 1.5 &&
            hasClearLine(grid, p, hero, HERO_PATH_CLEARANCE)) {
          dx = hero.x - p.x;
          dz = hero.z - p.z;
        }
      }
      if (dx === 0 && dz === 0) {
        while (route.length > 0 && withinReach(p, route[0])) route.shift();
        if (route.length > 0) {
          const direction = directionToWaypoint(p, route).dir;
          dx = direction.x;
          dz = direction.z;
        }
      }
      // A route inside the home cell is empty, so close the last few units.
      if (dx === 0 && dz === 0 && entity.state === 'patrol' &&
          hasClearLine(grid, p, home, HERO_PATH_CLEARANCE)) {
        dx = home.x - p.x;
        dz = home.z - p.z;
      }
      if (dx === 0 && dz === 0) return;
      const found = monsterIndex.queryRadius(
        position.x, position.z, SEPARATION_RADIUS, neighbors
      );
      separationVector(position.x, position.z, entity, found, separation);
      dx += separation.x * 0.6;
      dz += separation.z * 0.6;
      const length = Math.hypot(dx, dz);
      if (length <= 1e-6) return;
      dx /= length;
      dz /= length;
      out.x = dx;
      out.z = dz;
      entity.heading = Math.atan2(dx, dz);
    },
  };
}
