import { Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DungeonLayout, Entity } from '../../types';
import { PHYSICS_TIME_STEP } from '../constants';
import { FLOOR_TOP, gridToWorld, worldToGrid } from '../dungeon/constants';
import { generateDungeon } from '../dungeon/generateDungeon';
import { createHero, createMonster, world } from '../ecs';
import { MONSTER_ARCHETYPES } from './archetypes';
import { createMonsterBrain } from './ai/monsterBrain';
import { rebuildMonsterIndex, monsterIndex } from './monsterIndex';
import { planSpawns } from './spawnPlan';
import { createWalkGrid } from '../hero/navigation/walkGrid';
import { hasClearLine } from '../hero/navigation/smoothPath';
import { HERO_PATH_CLEARANCE } from '../hero/constants';
import { createHitTracker } from '../hero/combat/swordHits';
import { drainHits, pushHit } from '../combat/hitEvents';
import { drainDeaths, pushDeath } from '../combat/deathEvents';
import { resolveHits } from '../combat/resolveHits';
import { createMonsterAttack, tickMonsterAttack } from '../combat/monsterAttack';
import { applyDamage } from '../combat/damage';
import { HERO_IFRAME_MS } from '../combat/constants';
import { knockbackDirection, knockbackFactor } from '../combat/knockback';
const SEED = 42;
const DEPTH = 1;
const STEPS_PER_TICK = 12;
const created: Entity[] = [];
function pointOf(layout: DungeonLayout, x: number, z: number) {
  return { x: gridToWorld(x, layout.size), z: gridToWorld(z, layout.size) };
}
function track(entity: Entity): Entity {
  created.push(entity);
  return entity;
}
function findAggroSetup(
  layout: DungeonLayout,
  grid: ReturnType<typeof createWalkGrid>,
  monsters: Entity[]
): { monster: Entity; point: { x: number; z: number } } | null {
  for (const monster of monsters) {
    const stats = MONSTER_ARCHETYPES[monster.archetype ?? 'slime'];
    const origin = { x: monster.position!.x, z: monster.position!.z };
    let best: { x: number; z: number } | null = null;
    let bestDistance = Infinity;
    for (const cell of layout.floorCells) {
      const point = pointOf(layout, cell.x, cell.z);
      const distance = Math.hypot(point.x - origin.x, point.z - origin.z);
      if (distance < 1 || distance > stats.aggroRange * 0.9) continue;
      if (!hasClearLine(grid, origin, point, HERO_PATH_CLEARANCE)) continue;
      if (distance < bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    if (best) return { monster, point: best };
  }
  return null;
}
beforeEach(() => {
  drainHits(() => undefined);
  drainDeaths(() => undefined);
});
afterEach(() => {
  for (const entity of created) world.remove(entity);
  created.length = 0;
  rebuildMonsterIndex();
});
describe('Step 6 integration scenario', () => {
  it('runs spawn, index, aggro, combat, death, and cleanup on a fixed seed', () => {
    const layout = generateDungeon(SEED);
    const grid = createWalkGrid(layout);
    const plan = planSpawns(layout, DEPTH);
    expect(plan).toEqual(planSpawns(layout, DEPTH));
    expect(plan.monsters.length).toBeGreaterThan(0);
    const floor = new Set(
      layout.floorCells.map((cell) => `${cell.x},${cell.z}`)
    );
    for (const spawn of plan.monsters) {
      expect(spawn.roomIndex).not.toBe(0);
      expect(floor.has(`${spawn.cell.x},${spawn.cell.z}`)).toBe(true);
    }
    const key = `${plan.key.cell.x},${plan.key.cell.z}`;
    expect(key).not.toBe(`${plan.stairs.cell.x},${plan.stairs.cell.z}`);
    const monsters = plan.monsters.map((spawn) => {
      const point = pointOf(layout, spawn.cell.x, spawn.cell.z);
      const position = new Vector3(point.x, FLOOR_TOP, point.z);
      return track(
        createMonster(position, spawn.archetype, {
          depth: DEPTH,
          roomIndex: spawn.roomIndex,
        })
      );
    });
    const spawn = layout.spawn;
    const hero = track(createHero(new Vector3(spawn.x, spawn.y, spawn.z)));
    rebuildMonsterIndex();
    expect(monsterIndex.size).toBe(monsters.length);
    // Aggro, routing, and arrival through the real brain.
    const setup = findAggroSetup(layout, grid, monsters);
    expect(setup).not.toBeNull();
    const brain = createMonsterBrain(
      setup!.monster,
      layout,
      grid,
      () => setup!.point,
      SEED
    );
    const direction = { x: 0, z: 0 };
    const stats = MONSTER_ARCHETYPES[setup!.monster.archetype ?? 'slime'];
    const stepDistance = stats.moveSpeed * PHYSICS_TIME_STEP;
    let offGrid = false;

    for (let step = 0; step < 600; step++) {
      if (step % STEPS_PER_TICK === 0) {
        brain.tick(step * PHYSICS_TIME_STEP * 1000);
      }
      brain.desiredDirection(0, direction);
      const position = setup!.monster.position!;
      position.x += direction.x * stepDistance;
      position.z += direction.z * stepDistance;
      if (
        !grid.isWalkable(
          worldToGrid(position.x, layout.size),
          worldToGrid(position.z, layout.size)
        )
      ) {
        offGrid = true;
      }
    }
    expect(offGrid).toBe(false);
    expect(setup!.monster.state).toBe('attack');

    // One sword hit per monster per swing, then damage until death.
    const tracker = createHitTracker();
    const target = monsters[monsters.length - 1];
    const expectedHits = Math.ceil(
      (target.maxHealth ?? 0) / (hero.attackPower ?? 10)
    );
    const ids: string[] = [];
    const applied: string[] = [];
    tracker.enter(target.id);

    for (let swing = 1; swing <= expectedHits; swing++) {
      const now = 1000 + swing * 250;
      const first = tracker.collect(swing, 'active', ids);
      expect(first).toEqual([target.id]);
      for (const id of first) pushHit(id, swing, now);
      expect(tracker.collect(swing, 'active', ids)).toEqual([]);

      const count = resolveHits(
        (id) => monsters.find((monster) => monster.id === id),
        hero,
        now,
        (monster, _dealt, killed) => {
          applied.push(monster.id);
          if (killed) pushDeath(monster.id, now);
        }
      );
      expect(count, `swing ${swing} of ${expectedHits}`).toBe(1);
    }
    expect(applied).toHaveLength(expectedHits);
    expect(target.health).toBe(0);
    expect(target.state).toBe('dead');

    const deaths: string[] = [];
    drainDeaths((event) => deaths.push(event.id));
    expect(deaths).toEqual([target.id]);
    rebuildMonsterIndex();
    expect(monsterIndex.size).toBe(monsters.length - 1);

    // Monster strike timing, hero damage, and i-frames.
    const attacker = setup!.monster;
    attacker.state = 'attack';
    attacker.attackReadyAt = 0;
    const attack = createMonsterAttack();
    expect(tickMonsterAttack(attack, attacker, stats, 5000)).toBe('started');
    const strikeAt = 5000 + stats.attackWindupMs;
    expect(tickMonsterAttack(attack, attacker, stats, strikeAt)).toBe('strike');

    const heroHealth = hero.health ?? 0;
    const damage = applyDamage(
      hero,
      attacker.attackPower ?? 0,
      strikeAt,
      HERO_IFRAME_MS
    );
    expect(damage.applied).toBe(true);
    expect(hero.health).toBe(heroHealth - (attacker.attackPower ?? 0));
    expect(applyDamage(hero, 99, strikeAt + 1, HERO_IFRAME_MS).applied).toBe(
      false
    );

    // Knockback points away from the hero and fades out.
    const knock = { x: 0, z: 0 };
    knockbackDirection(0, 0, 1, 0, knock);
    expect(knock).toEqual({ x: 1, z: 0 });
    expect(knockbackFactor(strikeAt, strikeAt + 150, 150)).toBe(1);
    expect(knockbackFactor(strikeAt + 225, strikeAt + 150, 150)).toBe(0);
  });
});
