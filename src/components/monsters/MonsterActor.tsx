import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import { easing } from 'maath';
import type { Entity } from '../../types';
import { heroQuery } from '../../game/ecs';
import { getDungeonLayout } from '../../game/dungeon/getDungeonLayout';
import { useGameStore } from '../../game/store';
import { createWalkGrid } from '../../game/hero/navigation/walkGrid';
import { HERO_GROUND_CLEARANCE } from '../../game/hero/constants';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';
import { createMonsterBrain } from '../../game/monsters/ai/monsterBrain';
import { hashMonsterId } from '../../game/monsters/monsterHash';
import { registerMonster, unregisterMonster } from '../../game/monsters/monsterRegistry';
import Monster, { type MonsterRig } from './Monster';

interface MonsterActorProps {
  entity: Entity;
}

const heroPoint = { x: 0, z: 0 };

function getHeroPoint() {
  const position = heroQuery.first?.position;
  if (!position) return null;
  heroPoint.x = position.x;
  heroPoint.z = position.z;
  return heroPoint;
}

/** One live monster: kinematic capsule, brain, animation, and a dev label. */
export default function MonsterActor({ entity }: MonsterActorProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const colliderRef = useRef<RapierCollider>(null);
  const rigRef = useRef<MonsterRig>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const pathDebug = useGameStore((state) => state.pathDebug);
  const depth = useGameStore((state) => state.currentDepth);
  const layout = getDungeonLayout(depth);
  const stats = MONSTER_ARCHETYPES[entity.archetype ?? 'slime'];

  const brain = useMemo(() => {
    const grid = createWalkGrid(layout);
    return createMonsterBrain(
      entity,
      layout,
      grid,
      getHeroPoint,
      layout.seed ^ hashMonsterId(entity.id)
    );
  }, [entity, layout]);

  useEffect(() => {
    const body = bodyRef.current;
    const collider = colliderRef.current;
    if (!body || !collider) return;
    registerMonster({ entity, body, collider, brain, rig: rigRef.current });
    return () => unregisterMonster(entity.id);
  }, [entity, brain]);

  useFrame((state, delta) => {
    // The brain mutates entity.state outside React, so update the dev label
    // imperatively instead of waiting for a render that never comes.
    if (statusRef.current) {
      statusRef.current.textContent = entity.state ?? '';
    }

    const rig = rigRef.current;
    if (!rig?.visual) return;
    easing.dampAngle(rig.visual.rotation, 'y', entity.heading ?? 0, 0.12, delta);

    const moving = entity.state === 'chase' || entity.state === 'patrol';
    const bat = entity.archetype === 'bat';
    const t = state.clock.elapsedTime;
    const bob = moving ? Math.sin(t * (bat ? 14 : 9)) * (bat ? 0.05 : 0.03) : 0;
    easing.damp(rig.visual.position, 'y', bob, 0.1, delta);

    const squash =
      moving && entity.archetype === 'slime' ? 1 + 0.06 * Math.sin(t * 9) : 1;
    easing.damp(rig.visual.scale, 'y', squash, 0.1, delta);
  });

  const halfHeight = Math.max(0.01, (stats.height - 2 * stats.radius) / 2);
  const centerY = HERO_GROUND_CLEARANCE + halfHeight + stats.radius;
  const position: [number, number, number] = [
    entity.position?.x ?? 0,
    entity.position?.y ?? 0,
    entity.position?.z ?? 0,
  ];

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} canSleep={false} lockRotations position={position}>
      <CapsuleCollider ref={colliderRef} args={[halfHeight, stats.radius]} position={[0, centerY, 0]} />
      <Monster archetype={entity.archetype!} rigRef={rigRef} />
      {import.meta.env.DEV && pathDebug && (
        <Html position={[0, stats.height + 0.25, 0]} center style={{ pointerEvents: 'none', fontSize: 10 }}>
          <span ref={statusRef}>{entity.state}</span>
        </Html>
      )}
    </RigidBody>
  );
}
