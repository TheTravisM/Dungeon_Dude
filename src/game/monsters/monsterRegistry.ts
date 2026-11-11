import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import type { Entity } from '../../types';
import type { MonsterBrain } from './ai/monsterBrain';
import type { MonsterRig } from '../../components/monsters/Monster';

export interface RegisteredMonster {
  entity: Entity;
  body: RapierRigidBody;
  collider: RapierCollider;
  brain: MonsterBrain;
  rig: MonsterRig | null;
}

const registry = new Map<string, RegisteredMonster>();

export function registerMonster(entry: RegisteredMonster): void {
  registry.set(entry.entity.id, entry);
}

export function unregisterMonster(id: string): void {
  registry.delete(id);
}

export function hasMonster(id: string): boolean {
  return registry.has(id);
}

export function forEachMonster(
  callback: (entry: RegisteredMonster) => void
): void {
  for (const entry of registry.values()) callback(entry);
}
