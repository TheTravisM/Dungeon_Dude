import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createMonster, monsterQuery, world } from '../ecs';
import { HERO_SPEED } from '../hero/constants';
import {
  MONSTER_ARCHETYPES,
  MONSTER_ARCHETYPE_IDS,
  scaleStat,
} from './archetypes';

const KEYS = [
  'archetype',
  'attackPower',
  'attackReadyAt',
  'health',
  'heading',
  'hurtUntil',
  'id',
  'isMonster',
  'maxHealth',
  'position',
  'roomIndex',
  'state',
  'velocity',
].sort();

describe('MONSTER_ARCHETYPES', () => {
  it('contains exactly the declared ids', () => {
    expect([...MONSTER_ARCHETYPE_IDS]).toEqual(['slime', 'skeleton', 'bat']);
    for (const id of MONSTER_ARCHETYPE_IDS) {
      expect(MONSTER_ARCHETYPES[id].id).toBe(id);
    }
  });

  it('has finite positive numbers and sensible ranges', () => {
    for (const id of MONSTER_ARCHETYPE_IDS) {
      const stats = MONSTER_ARCHETYPES[id];
      for (const value of [
        stats.maxHealth,
        stats.attackPower,
        stats.moveSpeed,
        stats.aggroRange,
        stats.attackRange,
        stats.attackWindupMs,
        stats.attackCooldownMs,
        stats.radius,
        stats.height,
        stats.gold,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
      expect(stats.aggroRange).toBeGreaterThan(stats.attackRange);
      expect(stats.moveSpeed).toBeLessThan(HERO_SPEED);
      expect(stats.radius).toBeLessThanOrEqual(0.3);
    }
  });

  it('is frozen at both levels', () => {
    expect(Object.isFrozen(MONSTER_ARCHETYPES)).toBe(true);
    for (const id of MONSTER_ARCHETYPE_IDS) {
      const stats = MONSTER_ARCHETYPES[id];
      expect(Object.isFrozen(stats)).toBe(true);
      expect(() => {
        (stats as { maxHealth: number }).maxHealth = 999;
      }).toThrow();
      expect(MONSTER_ARCHETYPES[id].maxHealth).not.toBe(999);
    }
  });
});

describe('scaleStat', () => {
  it('keeps depth 1 unchanged and treats depth 0 as depth 1', () => {
    expect(scaleStat(30, 1)).toBe(30);
    expect(scaleStat(30, 0)).toBe(30);
  });

  it('is non-decreasing for depths 1 to 20', () => {
    let previous = scaleStat(30, 1);
    for (let depth = 2; depth <= 20; depth++) {
      const value = scaleStat(30, depth);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('createMonster', () => {
  it('gives every archetype the same component shape', () => {
    const startSize = monsterQuery.size;
    const input = new Vector3(1, 0.06, 2);
    const entities = MONSTER_ARCHETYPE_IDS.map((id) =>
      createMonster(input, id)
    );

    for (const entity of entities) {
      expect(Object.keys(entity).sort()).toEqual(KEYS);
      expect(entity.health).toBe(entity.maxHealth);
      expect(entity.state).toBe('idle');
      expect(entity.position).not.toBe(input);
    }

    input.set(9, 9, 9);
    expect(entities[0].position?.x).toBe(1);
    expect(monsterQuery.size).toBe(startSize + 3);

    for (const entity of entities) world.remove(entity);
    expect(monsterQuery.size).toBe(startSize);
  });

  it('scales health and attack power with depth', () => {
    const startSize = monsterQuery.size;
    const entity = createMonster(new Vector3(), 'skeleton', { depth: 3 });

    expect(entity.maxHealth).toBe(scaleStat(20, 3));
    expect(entity.health).toBe(scaleStat(20, 3));
    expect(entity.attackPower).toBe(scaleStat(12, 3));
    expect(entity.roomIndex).toBe(-1);
    expect(entity.archetype).toBe('skeleton');

    world.remove(entity);
    expect(monsterQuery.size).toBe(startSize);
  });
});
