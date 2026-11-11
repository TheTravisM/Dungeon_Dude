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
import { useHeroEntity } from '../../hooks/hero/useHeroEntity';
import { useHeroRig } from '../../hooks/hero/useHeroRig';
import type { DungeonLayout } from '../../types';
import HeroModel from './HeroModel';

interface HeroProps {
  layout: DungeonLayout;
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

  const bodyRef = useRef<RapierRigidBody>(null);
  const colliderRef = useRef<RapierCollider>(null);
  const { spawn } = layout;

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
