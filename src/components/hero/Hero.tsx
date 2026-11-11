import { useRef } from 'react';
import {
  CapsuleCollider,
  RigidBody,
  type RapierCollider,
  type RapierRigidBody,
} from '@react-three/rapier';
import {
  HERO_CAPSULE_CENTER_Y,
  HERO_CAPSULE_HALF_HEIGHT,
  HERO_RADIUS,
} from '../../game/hero/constants';
import { heroQuery } from '../../game/ecs';
import { resolveHeroDirection } from '../../game/hero/intent';
import { useHeroEntity } from '../../hooks/hero/useHeroEntity';
import { useHeroAnimation } from '../../hooks/hero/useHeroAnimation';
import { useHeroMovement } from '../../hooks/hero/useHeroMovement';
import { useHeroRig } from '../../hooks/hero/useHeroRig';
import type { DungeonLayout } from '../../types';
import HeroModel from './HeroModel';

interface HeroProps {
  layout: DungeonLayout;
}

/** Scratch position for the intent resolver; avoids per-step allocation. */
const heroPosition = { x: 0, z: 0 };
const ZERO_DIRECTION = { x: 0, z: 0 };

/**
 * Manual input wins while its four-second window is active; otherwise the hero
 * follows the active autonomous route. Mode arbitration lives in `intent.ts`.
 */
function desiredDirection(nowMs: number): { x: number; z: number } {
  const position = heroQuery.first?.position;
  if (!position) return ZERO_DIRECTION;

  heroPosition.x = position.x;
  heroPosition.z = position.z;
  return resolveHeroDirection(nowMs, heroPosition);
}

/**
 * Owns the hero's ECS entity, kinematic Rapier body, and visual rig.
 *
 * The body origin is the hero's feet, and the capsule is raised by
 * `HERO_CAPSULE_CENTER_Y` so its bottom floats just above the floor. The visual
 * model is a child of the body, so interpolation moves it with physics.
 */
export default function Hero({ layout }: HeroProps) {
  useHeroEntity(layout.spawn);
  const rig = useHeroRig();
  useHeroAnimation(rig);

  const bodyRef = useRef<RapierRigidBody>(null);
  const colliderRef = useRef<RapierCollider>(null);
  const { spawn } = layout;

  useHeroMovement(bodyRef, colliderRef, desiredDirection);

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      canSleep={false}
      position={[spawn.x, spawn.y, spawn.z]}
    >
      <CapsuleCollider
        ref={colliderRef}
        args={[HERO_CAPSULE_HALF_HEIGHT, HERO_RADIUS]}
        position={[0, HERO_CAPSULE_CENTER_Y, 0]}
      />
      <HeroModel rig={rig} />
    </RigidBody>
  );
}
