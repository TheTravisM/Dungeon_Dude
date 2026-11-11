import { afterEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Entity } from '../../types';
import { createMonster, world } from '../ecs';
import { MONSTER_ARCHETYPES } from '../monsters/archetypes';
import {
  createMonsterAttack,
  tickMonsterAttack,
  type MonsterAttackState,
} from './monsterAttack';

const slime = MONSTER_ARCHETYPES.slime;
const created: Entity[] = [];

function makeMonster(): Entity {
  const monster = createMonster(new Vector3(), 'slime');
  created.push(monster);
  return monster;
}

function start(entity: Entity, state: MonsterAttackState, now: number): void {
  entity.state = 'attack';
  entity.attackReadyAt = 0;
  expect(tickMonsterAttack(state, entity, slime, now)).toBe('started');
  expect(state.phase).toBe('windup');
}

afterEach(() => {
  for (const entity of created) world.remove(entity);
  created.length = 0;
});

describe('tickMonsterAttack', () => {
  it('only starts when the monster is in attack state and ready', () => {
    const entity = makeMonster();
    const state = createMonsterAttack();

    expect(tickMonsterAttack(state, entity, slime, 1000)).toBe('none');

    entity.state = 'attack';
    entity.attackReadyAt = 2000;
    expect(tickMonsterAttack(state, entity, slime, 1000)).toBe('none');
    expect(tickMonsterAttack(state, entity, slime, 2000)).toBe('started');
  });

  it('strikes exactly one wind-up after starting', () => {
    const entity = makeMonster();
    const state = createMonsterAttack();
    start(entity, state, 1000);

    expect(tickMonsterAttack(state, entity, slime, 1599)).toBe('none');
    expect(tickMonsterAttack(state, entity, slime, 1600)).toBe('strike');
    expect(state.phase).toBe('idle');
    expect(entity.attackReadyAt).toBe(1600 + slime.attackCooldownMs);
  });

  it('blocks the next start until the cooldown ends', () => {
    const entity = makeMonster();
    const state = createMonsterAttack();
    start(entity, state, 1000);
    tickMonsterAttack(state, entity, slime, 1600);

    expect(tickMonsterAttack(state, entity, slime, 2000)).toBe('none');
    expect(tickMonsterAttack(state, entity, slime, 3000)).toBe('started');
  });

  it('cancels when the monster leaves attack state mid wind-up', () => {
    const entity = makeMonster();
    const state = createMonsterAttack();
    start(entity, state, 1000);

    entity.state = 'chase';
    expect(tickMonsterAttack(state, entity, slime, 1200)).toBe('cancelled');
    expect(state.phase).toBe('idle');
    expect(entity.attackReadyAt).toBe(1500);
  });

  it('cancels a wind-up interrupted by a hit', () => {
    const entity = makeMonster();
    const state = createMonsterAttack();
    start(entity, state, 1000);

    entity.hurtUntil = 1400;
    expect(tickMonsterAttack(state, entity, slime, 1200)).toBe('cancelled');
  });

  it('never strikes after death', () => {
    const entity = makeMonster();
    const state = createMonsterAttack();
    start(entity, state, 1000);

    entity.state = 'dead';
    expect(tickMonsterAttack(state, entity, slime, 1600)).toBe('cancelled');
    expect(tickMonsterAttack(state, entity, slime, 1700)).toBe('none');
  });
});
