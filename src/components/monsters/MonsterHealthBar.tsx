import { useRef } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { Entity } from '../../types';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';

const WIDTH = 0.9;
const HEIGHT = 0.1;

interface MonsterHealthBarProps {
  entity: Entity;
}

/**
 * Billboarded health bar above one monster. Reads the mutable entity directly
 * from the frame loop; hidden at full health and while the monster is dead.
 */
export default function MonsterHealthBar({ entity }: MonsterHealthBarProps) {
  const barRef = useRef<Group>(null);
  const fillRef = useRef<Mesh>(null);
  const stats = MONSTER_ARCHETYPES[entity.archetype ?? 'slime'];

  useFrame(() => {
    const bar = barRef.current;
    const fill = fillRef.current;
    if (!bar || !fill) return;

    const max = entity.maxHealth ?? 1;
    const ratio = Math.max(0, Math.min(1, (entity.health ?? 0) / max));
    bar.visible = entity.state !== 'dead' && ratio < 0.999;

    fill.scale.x = Math.max(0.0001, ratio);
    fill.position.x = -(WIDTH * (1 - ratio)) / 2;
  });

  return (
    <Billboard
      ref={barRef}
      position={[0, stats.height + 0.3, 0]}
      visible={false}
    >
      <mesh>
        <planeGeometry args={[WIDTH, HEIGHT]} />
        <meshBasicMaterial
          color="#241a18"
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.001]}>
        <planeGeometry args={[WIDTH, HEIGHT * 0.72]} />
        <meshBasicMaterial color="#d9433f" depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}
