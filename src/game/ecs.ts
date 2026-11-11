import { World } from 'miniplex';
import { Vector3 } from 'three';
import type { Entity, MonsterArchetypeId } from '../types';
import { MONSTER_ARCHETYPES, scaleStat } from './monsters/archetypes';

/**
 * The single ECS world for the game. It lives at module scope so systems and
 * rendering hooks can read and mutate it without going through React state.
 *
 * We intentionally use miniplex 2.0.0 directly rather than @miniplex/react.
 * The React binding is a different, pre-release World class and would trigger
 * re-renders for per-frame game data, which is exactly what the architecture
 * rules forbid.
 */
export const world = new World<Entity>();

/** Entities that can be driven by the hero controllers and AI systems. */
export const heroQuery = world.with('isHero', 'position', 'velocity', 'health', 'maxHealth');

/** Entities that can be targeted and attacked. */
export const monsterQuery = world.with(
  'isMonster',
  'position',
  'velocity',
  'health',
  'maxHealth'
);

/** Static or interactive scenery that is neither the hero nor a monster. */
export const propQuery = world.with('position').without('isHero', 'isMonster');

/** Keys and stairs that can be picked up or used. */
export const poiQuery = world.with('poiType', 'position', 'isActive');

let entitySequence = 0;

/**
 * Entity IDs are only unique within a session. They are stable for debugging
 * and for React keys, not for persistence or networking.
 */
function nextEntityId(prefix: string): string {
  entitySequence += 1;
  return `${prefix}-${entitySequence}`;
}

/**
 * Creates the hero entity. Movement and combat systems fill in the mutable
 * vectors later; the factory only establishes the initial component shape so
 * the entity does not bounce between archetypes as fields are added.
 */
export function createHero(position: Vector3): Entity {
  return world.add({
    id: nextEntityId('hero'),
    isHero: true,
    position: position.clone(),
    velocity: [0, 0, 0],
    health: 100,
    maxHealth: 100,
    attackPower: 10,
    state: 'idle',
    heading: 0,
  });
}

interface MonsterOptions {
  depth?: number;      // defaults to 1; scales health and attack power
  roomIndex?: number;  // defaults to -1 (not tied to a room)
}

/**
 * Creates a monster entity with the same component shape every time. Keeping
 * the shape stable avoids archetype churn when many monsters spawn at once.
 * Stats come from the frozen archetype table; the entity stores only mutable
 * state and the archetype id.
 */
export function createMonster(
  position: Vector3,
  archetype: MonsterArchetypeId,
  options: MonsterOptions = {}
): Entity {
  const stats = MONSTER_ARCHETYPES[archetype];
  const depth = options.depth ?? 1;
  const maxHealth = scaleStat(stats.maxHealth, depth);

  return world.add({
    id: nextEntityId('monster'),
    isMonster: true,
    position: position.clone(),
    velocity: [0, 0, 0],
    health: maxHealth,
    maxHealth,
    attackPower: scaleStat(stats.attackPower, depth),
    state: 'idle',
    heading: 0,
    archetype,
    roomIndex: options.roomIndex ?? -1,
    attackReadyAt: 0,
    hurtUntil: 0,
  });
}

/**
 * Creates a scenery entity. Props have no combat components, so the prop query
 * naturally excludes heroes and monsters.
 */
export function createProp(position: Vector3): Entity {
  return world.add({
    id: nextEntityId('prop'),
    position: position.clone(),
    state: 'idle',
  });
}

/** Creates a key or stairs marker. POIs are inert until a later task acts. */
export function createPoi(position: Vector3, poiType: 'key' | 'stairs'): Entity {
  return world.add({
    id: nextEntityId('poi'),
    position: position.clone(),
    state: 'idle',
    poiType,
    isActive: true,
  });
}
