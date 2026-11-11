import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  useBeforePhysicsStep,
  useRapier,
  type RapierCollider,
} from '@react-three/rapier';
import { PHYSICS_TIME_STEP } from '../../game/constants';
import { FLOOR_TOP } from '../../game/dungeon/constants';
import { HERO_CONTROLLER_OFFSET } from '../../game/hero/constants';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';
import { hashMonsterId } from '../../game/monsters/monsterHash';
import {
  forEachMonster,
  hasMonster,
  type RegisteredMonster,
} from '../../game/monsters/monsterRegistry';

/** QueryFilterFlags.EXCLUDE_KINEMATIC; keeps monsters from colliding with each other and the hero. */
const EXCLUDE_KINEMATIC = 2;

interface CharacterController {
  setSlideEnabled(enabled: boolean): void;
  disableAutostep(): void;
  disableSnapToGround(): void;
  setApplyImpulsesToDynamicBodies(enabled: boolean): void;
  computeColliderMovement(
    collider: RapierCollider,
    desiredTranslation: { x: number; y: number; z: number },
    filterFlags?: number
  ): void;
  computedMovement(): { x: number; y: number; z: number };
}

const direction = { x: 0, z: 0 };
const delta = { x: 0, y: 0, z: 0 };
const target = { x: 0, y: 0, z: 0 };

/**
 * Drives every registered monster. Brains decide at ~5 Hz, staggered; movement
 * runs every physics step through one shared kinematic character controller.
 */
export default function MonsterSystem() {
  const { world } = useRapier();
  const controllerRef = useRef<CharacterController | null>(null);
  const nextTick = useRef(new Map<string, number>());

  useEffect(() => {
    const controller = world.createCharacterController(HERO_CONTROLLER_OFFSET);
    controller.setSlideEnabled(true);
    controller.disableAutostep();
    controller.disableSnapToGround();
    controller.setApplyImpulsesToDynamicBodies(false);
    controllerRef.current = controller;
    const scheduled = nextTick.current;
    return () => {
      controllerRef.current = null;
      world.removeCharacterController(controller);
      scheduled.clear();
    };
  }, [world]);

  useFrame(() => {
    const now = performance.now();
    let ticks = 0;

    forEachMonster((monster) => {
      if (ticks >= 4) return;
      const id = monster.entity.id;
      const phase = hashMonsterId(id);
      let due = nextTick.current.get(id);
      if (due === undefined) {
        due = now + (phase % 200);
        nextTick.current.set(id, due);
      }
      if (now < due) return;
      monster.brain.tick(now);
      nextTick.current.set(id, now + 200 + (phase % 41));
      ticks += 1;
    });

    // Ids are unique per spawn, so schedules from unloaded floors must be
    // dropped explicitly or the map grows for the whole session.
    for (const id of nextTick.current.keys()) {
      if (!hasMonster(id)) nextTick.current.delete(id);
    }
  });

  useBeforePhysicsStep(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    const now = performance.now();

    forEachMonster((monster: RegisteredMonster) => {
      if (monster.entity.state === 'dead') return;
      const stats = MONSTER_ARCHETYPES[monster.entity.archetype ?? 'slime'];

      monster.brain.desiredDirection(now, direction);
      delta.x = direction.x * stats.moveSpeed * PHYSICS_TIME_STEP;
      delta.y = 0;
      delta.z = direction.z * stats.moveSpeed * PHYSICS_TIME_STEP;

      controller.computeColliderMovement(monster.collider, delta, EXCLUDE_KINEMATIC);
      const movement = controller.computedMovement();
      const current = monster.body.translation();

      target.x = current.x + movement.x;
      target.y = current.y;
      target.z = current.z + movement.z;
      monster.body.setNextKinematicTranslation(target);

      const entity = monster.entity;
      entity.position?.set(target.x, FLOOR_TOP, target.z);
      if (entity.velocity) {
        entity.velocity[0] = movement.x / PHYSICS_TIME_STEP;
        entity.velocity[1] = 0;
        entity.velocity[2] = movement.z / PHYSICS_TIME_STEP;
      }
    });
  });

  return null;
}
