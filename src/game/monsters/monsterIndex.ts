import type { Entity } from '../../types';
import { monsterQuery } from '../ecs';
import { createSpatialHash, type SpatialHash } from './spatialHash';

export const MONSTER_INDEX_HZ = 20;

export const monsterIndex: SpatialHash<Entity> = createSpatialHash<Entity>(2);

/** Rebuilds the living-monster index in place; allocates nothing steady-state. */
export function rebuildMonsterIndex(): void {
  monsterIndex.clear();

  const entities = monsterQuery.entities;
  for (let index = 0; index < entities.length; index++) {
    const entity = entities[index];
    if (entity.state === 'dead') continue;
    const position = entity.position;
    if (!position) continue;
    monsterIndex.insert(entity, position.x, position.z);
  }
}
