import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createMonster, monsterQuery, world } from '../ecs';
import { monsterIndex, rebuildMonsterIndex } from './monsterIndex';

describe('monsterIndex', () => {
  it('indexes living monsters at their positions', () => {
    const startSize = monsterQuery.size;
    const first = createMonster(new Vector3(0, 0, 0), 'slime');
    const second = createMonster(new Vector3(3, 0, 0), 'skeleton');
    createMonster(new Vector3(0, 0, 3), 'bat');

    rebuildMonsterIndex();
    expect(monsterIndex.size).toBe(startSize + 3);
    expect(monsterIndex.queryRadius(0, 0, 0.2, [])).toEqual([first]);
    expect(monsterIndex.queryRadius(3, 0, 0.2, [])).toEqual([second]);

    for (const entity of [...monsterQuery.entities]) world.remove(entity);
  });

  it('excludes dead monsters after a rebuild', () => {
    const startSize = monsterQuery.size;
    const monster = createMonster(new Vector3(1, 0, 1), 'slime');
    monster.state = 'dead';

    rebuildMonsterIndex();
    expect(monsterIndex.size).toBe(startSize);
    expect(monsterIndex.queryRadius(1, 1, 0.5, [])).toEqual([]);

    world.remove(monster);
  });
});
