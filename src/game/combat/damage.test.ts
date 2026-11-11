import { afterEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Entity } from '../../types';
import { createHero, createMonster, world } from '../ecs';
import { applyDamage } from './damage';

const created: Entity[] = [];

function track(entity: Entity): Entity {
  created.push(entity);
  return entity;
}

afterEach(() => {
  for (const entity of created) world.remove(entity);
  created.length = 0;
});

describe('applyDamage', () => {
  it('subtracts health and opens the hurt window', () => {
    const monster = track(createMonster(new Vector3(), 'slime'));
    monster.health = 30;

    const result = applyDamage(monster, 10, 1000, 180);

    expect(result).toEqual({ applied: true, dealt: 10, killed: false });
    expect(monster.health).toBe(20);
    expect(monster.hurtUntil).toBe(1180);
  });

  it('ignores a second hit inside the hurt window but allows one after', () => {
    const monster = track(createMonster(new Vector3(), 'slime'));
    monster.health = 30;

    applyDamage(monster, 10, 1000, 180);
    expect(applyDamage(monster, 10, 1100, 180).applied).toBe(false);
    expect(monster.health).toBe(20);

    expect(applyDamage(monster, 10, 1180, 180).applied).toBe(true);
    expect(monster.health).toBe(10);
  });

  it('ignores dead targets and never kills twice', () => {
    const monster = track(createMonster(new Vector3(), 'slime'));
    monster.health = 5;

    const first = applyDamage(monster, 10, 1000, 180);
    expect(first).toEqual({ applied: true, dealt: 5, killed: true });
    expect(monster.health).toBe(0);
    expect(monster.state).toBe('dead');

    const second = applyDamage(monster, 10, 2000, 180);
    expect(second).toEqual({ applied: false, dealt: 0, killed: false });
    expect(monster.health).toBe(0);
  });

  it('clamps the hero at 1 health while hero death is disabled', () => {
    const hero = track(createHero(new Vector3()));
    hero.health = 10;

    const result = applyDamage(hero, 50, 1000, 700);

    expect(result.applied).toBe(true);
    expect(result.killed).toBe(false);
    expect(hero.health).toBe(1);
    expect(hero.state).not.toBe('dead');
  });

  it('ignores zero and negative amounts', () => {
    const monster = track(createMonster(new Vector3(), 'slime'));
    monster.health = 30;

    expect(applyDamage(monster, 0, 1000, 180).applied).toBe(false);
    expect(applyDamage(monster, -5, 1000, 180).applied).toBe(false);
    expect(monster.health).toBe(30);
  });
});
