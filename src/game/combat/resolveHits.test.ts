import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Entity } from '../../types';
import { createHero, createMonster, world } from '../ecs';
import { drainHits, pushHit } from './hitEvents';
import { resolveHits } from './resolveHits';

const created: Entity[] = [];

function track(entity: Entity): Entity {
  created.push(entity);
  return entity;
}

afterEach(() => {
  for (const entity of created) world.remove(entity);
  created.length = 0;
});

beforeEach(() => {
  drainHits(() => undefined);
});

describe('resolveHits', () => {
  it('applies one hero hit and reports the damage', () => {
    const hero = track(createHero(new Vector3()));
    const monster = track(createMonster(new Vector3(1, 0, 0), 'slime'));
    monster.health = 25;
    const applied: Array<[string, number, boolean]> = [];

    pushHit(monster.id, 1, 1000);
    const count = resolveHits(
      (id) => (id === monster.id ? monster : undefined),
      hero,
      1000,
      (target, dealt, killed) => applied.push([target.id, dealt, killed])
    );

    expect(count).toBe(1);
    expect(monster.health).toBe(15);
    expect(applied).toEqual([[monster.id, 10, false]]);
  });

  it('reports a kill and leaves the queue empty', () => {
    const hero = track(createHero(new Vector3()));
    const monster = track(createMonster(new Vector3(1, 0, 0), 'bat'));
    monster.health = 5;
    let killed = false;

    pushHit(monster.id, 2, 1000);
    resolveHits(
      (id) => (id === monster.id ? monster : undefined),
      hero,
      1000,
      (_, __, didKill) => {
        killed = didKill;
      }
    );

    expect(killed).toBe(true);
    expect(monster.state).toBe('dead');

    const seen: string[] = [];
    drainHits((event) => seen.push(event.targetId));
    expect(seen).toEqual([]);
  });

  it('applies only once for two events inside the hurt window', () => {
    const hero = track(createHero(new Vector3()));
    const monster = track(createMonster(new Vector3(1, 0, 0), 'skeleton'));
    monster.health = 20;
    let applied = 0;

    pushHit(monster.id, 3, 1000);
    pushHit(monster.id, 3, 1000);
    const count = resolveHits(
      (id) => (id === monster.id ? monster : undefined),
      hero,
      1000,
      () => {
        applied += 1;
      }
    );

    expect(count).toBe(1);
    expect(applied).toBe(1);
    expect(monster.health).toBe(10);
  });

  it('ignores unknown monster ids', () => {
    const hero = track(createHero(new Vector3()));
    let applied = 0;

    pushHit('missing', 4, 1000);
    const count = resolveHits(() => undefined, hero, 1000, () => {
      applied += 1;
    });

    expect(count).toBe(0);
    expect(applied).toBe(0);
  });
});
