import { World } from 'miniplex';
import { Vector3 } from 'three';
import type { Entity } from '../types';

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
  health?: number;
  attackPower?: number;
}

/**
 * Creates a monster entity with the same component shape every time. Keeping
 * the shape stable avoids archetype churn when many monsters spawn at once.
 */
export function createMonster(position: Vector3, options: MonsterOptions = {}): Entity {
  const maxHealth = options.health ?? 30;

  return world.add({
    id: nextEntityId('monster'),
    isMonster: true,
    position: position.clone(),
    velocity: [0, 0, 0],
    health: maxHealth,
    maxHealth,
    attackPower: options.attackPower ?? 5,
    state: 'idle',
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
