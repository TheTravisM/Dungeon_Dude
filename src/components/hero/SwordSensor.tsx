import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BallCollider,
  useRapier,
  type RapierCollider,
} from '@react-three/rapier';
import { heroAttack } from '../../game/hero/combat/attackState';
import { swordTracker } from '../../game/hero/combat/swordHits';
import {
  HERO_CAPSULE_CENTER_Y,
  HERO_SWORD_OFFSET,
  HERO_SWORD_RADIUS,
} from '../../game/hero/constants';
import { pushHit } from '../../game/combat/hitEvents';
import { entityIdForCollider } from '../../game/monsters/monsterRegistry';
import type { HeroRig } from '../../hooks/hero/useHeroRig';

interface SwordSensorProps {
  rig: HeroRig;
}

/** Reused so the per-frame sensor update does not allocate. */
const sensorPosition = {
  x: 0,
  y: HERO_CAPSULE_CENTER_Y,
  z: HERO_SWORD_OFFSET,
};
const collectedIds: string[] = [];

/**
 * Ball sensor in front of the hero. It follows the visible heading (the body
 * itself is never rotated), records intersection events by monster id, and
 * queues one hit per monster per swing during the active phase.
 *
 * `ActiveCollisionTypes.ALL` is required because both the hero and monsters are
 * kinematic bodies, and Rapier skips kinematic-kinematic pairs by default.
 */
export default function SwordSensor({ rig }: SwordSensorProps) {
  const sensorRef = useRef<RapierCollider>(null);
  const { rapier } = useRapier();

  useFrame(() => {
    const sensor = sensorRef.current;
    if (!sensor) return;

    const heading = rig.root.current?.rotation.y ?? 0;
    sensorPosition.x = Math.sin(heading) * HERO_SWORD_OFFSET;
    sensorPosition.z = Math.cos(heading) * HERO_SWORD_OFFSET;
    sensor.setTranslationWrtParent(sensorPosition);

    swordTracker.collect(heroAttack.swingId, heroAttack.phase, collectedIds);
    if (collectedIds.length === 0) return;
    const now = performance.now();
    for (const id of collectedIds) pushHit(id, heroAttack.swingId, now);
  });

  return (
    <BallCollider
      ref={sensorRef}
      args={[HERO_SWORD_RADIUS]}
      sensor
      activeCollisionTypes={rapier.ActiveCollisionTypes.ALL}
      position={[0, HERO_CAPSULE_CENTER_Y, HERO_SWORD_OFFSET]}
      onIntersectionEnter={({ other }) => {
        const id = entityIdForCollider(other.collider.handle);
        if (id) swordTracker.enter(id);
      }}
      onIntersectionExit={({ other }) => {
        const id = entityIdForCollider(other.collider.handle);
        if (id) swordTracker.exit(id);
      }}
    />
  );
}
