import type { MonsterArchetypeId } from '../../types';

/** Immutable tuning for one monster type. Stats never live on entities. */
export interface MonsterArchetype {
  readonly id: MonsterArchetypeId;
  readonly label: string;
  readonly maxHealth: number;
  readonly attackPower: number;
  /** World units per second. Must stay below HERO_SPEED (3.0). */
  readonly moveSpeed: number;
  /** Tiles. Distance at which the monster notices the hero. */
  readonly aggroRange: number;
  /** Tiles, center to center. Distance at which a swing may start. */
  readonly attackRange: number;
  readonly attackWindupMs: number;
  readonly attackCooldownMs: number;
  /** Capsule radius. Corridors are two tiles wide, so keep <= 0.4. */
  readonly radius: number;
  readonly height: number;
  readonly gold: number;
}

const TABLE: Record<MonsterArchetypeId, MonsterArchetype> = {
  slime: Object.freeze({
    id: 'slime',
    label: 'Slime',
    maxHealth: 30,
    attackPower: 8,
    moveSpeed: 1.0,
    aggroRange: 4,
    attackRange: 0.9,
    attackWindupMs: 600,
    attackCooldownMs: 1400,
    radius: 0.3,
    height: 0.6,
    gold: 2,
  }),
  skeleton: Object.freeze({
    id: 'skeleton',
    label: 'Skeleton',
    maxHealth: 20,
    attackPower: 12,
    moveSpeed: 1.8,
    aggroRange: 6,
    attackRange: 1.0,
    attackWindupMs: 500,
    attackCooldownMs: 1100,
    radius: 0.26,
    height: 0.9,
    gold: 4,
  }),
  bat: Object.freeze({
    id: 'bat',
    label: 'Bat',
    maxHealth: 10,
    attackPower: 6,
    moveSpeed: 2.6,
    aggroRange: 7,
    attackRange: 0.8,
    attackWindupMs: 350,
    attackCooldownMs: 800,
    radius: 0.22,
    height: 0.5,
    gold: 3,
  }),
};

export const MONSTER_ARCHETYPES: Readonly<
  Record<MonsterArchetypeId, MonsterArchetype>
> = Object.freeze(TABLE);

export const MONSTER_ARCHETYPE_IDS: readonly MonsterArchetypeId[] =
  Object.freeze(['slime', 'skeleton', 'bat'] as const);

/** The single depth-scaling rule for monster health and attack power. */
export function scaleStat(base: number, depth: number): number {
  return Math.round(base * (1 + 0.15 * (Math.max(1, depth) - 1)));
}
