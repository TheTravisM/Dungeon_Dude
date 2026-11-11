import { useEffect, useRef, type RefObject } from 'react';
import {
  useBeforePhysicsStep,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from '@react-three/rapier';
import { PHYSICS_TIME_STEP } from '../../game/constants';
import { FLOOR_TOP } from '../../game/dungeon/constants';
import { heroQuery } from '../../game/ecs';
import { HERO_CONTROLLER_OFFSET, HERO_SPEED } from '../../game/hero/constants';

/**
 * The subset of Rapier's `CharacterController` this hook uses. Keeping the
 * shape local avoids importing from `@dimforge/rapier3d-compat`, which is only
 * a transitive dependency of `@react-three/rapier`.
 */
interface CharacterController {
  setSlideEnabled(enabled: boolean): void;
  disableAutostep(): void;
  disableSnapToGround(): void;
  setApplyImpulsesToDynamicBodies(enabled: boolean): void;
  computeColliderMovement(
    collider: RapierCollider,
    desiredTranslation: { x: number; y: number; z: number }
  ): void;
  computedMovement(): { x: number; y: number; z: number };
}

/** Reused per step so the movement callback does not churn fresh objects. */
const scratchDelta = { x: 0, y: 0, z: 0 };
const scratchTarget = { x: 0, y: 0, z: 0 };

/**
 * Drives the kinematic hero through Rapier's character controller.
 *
 * The controller resolves collisions and wall sliding; it never applies
 * gravity, so the target keeps the hero at `FLOOR_TOP`. Using
 * `setNextKinematicTranslation` (not `setTranslation`) is what lets the
 * renderer interpolate between fixed physics steps.
 */
export function useHeroMovement(
  bodyRef: RefObject<RapierRigidBody | null>,
  colliderRef: RefObject<RapierCollider | null>,
  getDesiredDirection: (nowMs: number) => { x: number; z: number }
): void {
  const { world } = useRapier();
  const controllerRef = useRef<CharacterController | null>(null);

  useEffect(() => {
    const controller = world.createCharacterController(HERO_CONTROLLER_OFFSET);
    controller.setSlideEnabled(true);
    controller.disableAutostep();
    controller.disableSnapToGround();
    controller.setApplyImpulsesToDynamicBodies(false);

    controllerRef.current = controller;

    return () => {
      controllerRef.current = null;
      world.removeCharacterController(controller);
    };
  }, [world]);

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    const collider = colliderRef.current;
    const controller = controllerRef.current;
    if (!body || !collider || !controller) return;

    const dir = getDesiredDirection(performance.now());

    scratchDelta.x = dir.x * HERO_SPEED * PHYSICS_TIME_STEP;
    scratchDelta.y = 0;
    scratchDelta.z = dir.z * HERO_SPEED * PHYSICS_TIME_STEP;

    controller.computeColliderMovement(collider, scratchDelta);
    const movement = controller.computedMovement();
    const current = body.translation();

    scratchTarget.x = current.x + movement.x;
    scratchTarget.y = FLOOR_TOP;
    scratchTarget.z = current.z + movement.z;

    body.setNextKinematicTranslation(scratchTarget);

    const hero = heroQuery.first;
    if (!hero) return;

    hero.position?.set(scratchTarget.x, scratchTarget.y, scratchTarget.z);
    if (hero.velocity) {
      hero.velocity[0] = movement.x / PHYSICS_TIME_STEP;
      hero.velocity[1] = 0;
      hero.velocity[2] = movement.z / PHYSICS_TIME_STEP;
    }
    if (dir.x !== 0 || dir.z !== 0) {
      hero.heading = Math.atan2(dir.x, dir.z);
    }
  });
}
