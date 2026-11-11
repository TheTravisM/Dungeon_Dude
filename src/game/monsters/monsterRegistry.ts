import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import type { Entity } from '../../types';
import {
  createMonsterAttack,
  type MonsterAttackState,
} from '../combat/monsterAttack';
import type { MonsterBrain } from './ai/monsterBrain';
import type { MonsterRig } from '../../components/monsters/Monster';

export interface MonsterRecordInput {
  entity: Entity;
  body: RapierRigidBody;
  collider: RapierCollider;
  brain: MonsterBrain;
  rig: MonsterRig | null;
}

export interface RegisteredMonster extends MonsterRecordInput {
  attack: MonsterAttackState;
  knockX: number;
  knockZ: number;
  knockUntil: number;
  strikeAtMs: number;
}

const registry = new Map<string, RegisteredMonster>();
const byCollider = new Map<number, string>();

export function registerMonster(entry: MonsterRecordInput): void {
  registry.set(entry.entity.id, {
    ...entry,
    attack: createMonsterAttack(),
    knockX: 0,
    knockZ: 0,
    knockUntil: 0,
    strikeAtMs: 0,
  });
  byCollider.set(entry.collider.handle, entry.entity.id);
}

export function unregisterMonster(id: string): void {
  const entry = registry.get(id);
  if (!entry) return;
  byCollider.delete(entry.collider.handle);
  registry.delete(id);
}

export function hasMonster(id: string): boolean {
  return registry.has(id);
}

export function getMonster(id: string): RegisteredMonster | undefined {
  return registry.get(id);
}

/** Maps a Rapier collider handle back to the monster entity id. */
export function entityIdForCollider(handle: number): string | undefined {
  return byCollider.get(handle);
}

export function forEachMonster(
  callback: (entry: RegisteredMonster) => void
): void {
  for (const entry of registry.values()) callback(entry);
}
