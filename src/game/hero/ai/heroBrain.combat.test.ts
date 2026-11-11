import { Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DungeonLayout, Entity } from '../../../types';
import { FLOOR_TOP, gridToWorld } from '../../dungeon/constants';
import { generateDungeon } from '../../dungeon/generateDungeon';
import { createHero, createMonster, world } from '../../ecs';
import { monsterIndex, rebuildMonsterIndex } from '../../monsters/monsterIndex';
import { combatDirection, heroCombat, resetCombat, wantsAttack } from '../combat/combatIntent';
import { HERO_ATTACK_REACH, HERO_PATH_CLEARANCE } from '../constants';
import { clearRoute, routeState } from '../navigation/routeState';
import { hasClearLine } from '../navigation/smoothPath';
import { createWalkGrid, type WalkGrid } from '../navigation/walkGrid';
import type { WorldPoint } from '../navigation/heroPath';
import { createHeroBrain, type HeroBrain } from './heroBrain';

const created: Entity[] = [];
const out = { x: 0, z: 0 };
const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

interface Setup {
  layout: DungeonLayout;
  grid: WalkGrid;
  hero: Entity;
  brain: HeroBrain;
  center: WorldPoint;
}

function worldPoint(layout: DungeonLayout, x: number, z: number): WorldPoint {
  return { x: gridToWorld(x, layout.size), z: gridToWorld(z, layout.size) };
}

function setup(seed: number, heroPoint?: WorldPoint): Setup {
  const layout = generateDungeon(seed);
  const grid = createWalkGrid(layout);
  const room = layout.rooms[0].center;
  const center = heroPoint ?? worldPoint(layout, room.x, room.z);
  const hero = createHero(new Vector3(center.x, FLOOR_TOP, center.z));
  created.push(hero);
  const brain = createHeroBrain(layout, () => hero.position!, () => undefined);
  return { layout, grid, hero, brain, center };
}

function addMonster(point: WorldPoint): Entity {
  const monster = createMonster(new Vector3(point.x, FLOOR_TOP, point.z), 'skeleton');
  created.push(monster);
  return monster;
}

/** A same-room floor cell 1.6 to 2.4 tiles from the hero with a clear line. */
function reachableCell(data: Setup): WorldPoint | null {
  for (const cell of data.layout.floorCells) {
    const point = worldPoint(data.layout, cell.x, cell.z);
    const dx = point.x - data.center.x;
    const dz = point.z - data.center.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 1.6 || distance > 2.4) continue;
    if (hasClearLine(data.grid, data.center, point, HERO_PATH_CLEARANCE)) return point;
  }
  return null;
}

/** A start-room floor cell with a solid neighbor, plus that wall point. */
function wallNeighbor(
  layout: DungeonLayout,
  grid: WalkGrid
): { hero: WorldPoint; wall: WorldPoint } | null {
  const room = layout.rooms[0];
  for (let z = room.z; z < room.z + room.depth; z++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (!grid.isWalkable(x, z)) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (grid.isWalkable(x + dx, z + dz)) continue;
        return { hero: worldPoint(layout, x, z), wall: worldPoint(layout, x + dx, z + dz) };
      }
    }
  }
  return null;
}

function cleanup(): void {
  for (const entity of created.splice(0)) world.remove(entity);
  monsterIndex.clear();
  clearRoute();
  resetCombat();
}

beforeEach(cleanup);
afterEach(cleanup);

describe('heroBrain combat', () => {
  it('chases to attack reach and then holds, faces, and attacks', () => {
    for (const seed of SEEDS) {
      const data = setup(seed);
      const target = reachableCell(data);
      expect(target, `seed ${seed} has no reachable nearby cell`).not.toBeNull();
      addMonster(target!);
      rebuildMonsterIndex();

      let now = 1000;
      data.brain.tick(now);
      expect(combatDirection(now, out)).toBe(true);

      const toTarget = { x: target!.x - data.center.x, z: target!.z - data.center.z };
      const length = Math.hypot(toTarget.x, toTarget.z);
      expect((out.x * toTarget.x + out.z * toTarget.z) / length).toBeGreaterThan(0.99);

      for (let step = 0; step < 60; step++) {
        const position = data.hero.position!;
        const dx = target!.x - position.x;
        const dz = target!.z - position.z;
        const distance = Math.hypot(dx, dz);
        if (distance <= HERO_ATTACK_REACH * 0.85) break;
        position.x += (dx / distance) * 0.1;
        position.z += (dz / distance) * 0.1;
        now += 100;
        data.brain.tick(now);
      }

      data.brain.tick(now);
      const position = data.hero.position!;
      expect(wantsAttack(now)).toBe(true);
      expect(combatDirection(now, out)).toBe(true);
      expect(out).toEqual({ x: 0, z: 0 });
      expect(data.hero.heading).toBeCloseTo(
        Math.atan2(target!.x - position.x, target!.z - position.z)
      );
      cleanup();
    }
  });

  it('ignores monsters beyond engage range and keeps exploring', () => {
    const data = setup(1);
    addMonster({ x: data.center.x + 100, z: data.center.z });
    rebuildMonsterIndex();
    data.brain.tick(1000);
    expect(combatDirection(1000, out)).toBe(false);
    expect(wantsAttack(1000)).toBe(false);
    expect(routeState.points.length).toBeGreaterThan(0);
  });

  it('does not attack through a wall', () => {
    const layout = generateDungeon(1);
    const spot = wallNeighbor(layout, createWalkGrid(layout));
    expect(spot).not.toBeNull();
    const data = setup(1, spot!.hero);
    addMonster(spot!.wall);
    rebuildMonsterIndex();
    expect(
      Math.hypot(spot!.wall.x - spot!.hero.x, spot!.wall.z - spot!.hero.z)
    ).toBeLessThan(HERO_ATTACK_REACH * 2);
    data.brain.tick(1000);
    expect(combatDirection(1000, out)).toBe(false);
    expect(wantsAttack(1000)).toBe(false);
  });

  it('disengages and plans again once the monster is gone', () => {
    const data = setup(1);
    const monster = addMonster(reachableCell(data)!);
    rebuildMonsterIndex();
    data.brain.tick(1000);
    expect(heroCombat.engaged).toBe(true);

    world.remove(monster);
    rebuildMonsterIndex();
    data.brain.tick(1300);
    expect(heroCombat.engaged).toBe(false);
    expect(routeState.points.length).toBeGreaterThan(0);
  });

  it('manual takeover clears the combat intent', () => {
    const data = setup(1);
    addMonster(reachableCell(data)!);
    rebuildMonsterIndex();
    data.brain.tick(1000);
    expect(heroCombat.engaged).toBe(true);

    data.brain.onManualTakeover(1100);
    expect(heroCombat.engaged).toBe(false);
    expect(combatDirection(1100, out)).toBe(false);
    expect(wantsAttack(1100)).toBe(false);
  });
});
