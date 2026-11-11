import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import {
  BoxGeometry,
  CircleGeometry,
  MeshStandardMaterial,
  type Group,
} from 'three';
import type { MonsterArchetypeId } from '../../types';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';
import { MONSTER_PARTS } from '../../game/monsters/monsterParts';

export interface MonsterRig {
  visual: Group;                       // bob / heading / squash target (later tasks)
  materials: MeshStandardMaterial[];   // for hit flash (later tasks)
}

interface MonsterProps {
  archetype: MonsterArchetypeId;
  rigRef?: Ref<MonsterRig>;            // React 19: ref is a normal prop
}

/** One unit cube shared by every monster part; never disposed. */
const BOX = new BoxGeometry(1, 1, 1);
/** Flat disc shared by every blob shadow; never disposed. */
const BLOB = new CircleGeometry(1, 16);

/**
 * Low-poly monster rendered from the frozen parts table. Faces local +Z so
 * `rotation.y = Math.atan2(dirX, dirZ)` matches the hero convention.
 *
 * Geometry is shared; materials are per instance so a future hit flash cannot
 * light up every monster of the same type. Monsters never cast real shadows.
 */
export default function Monster({ archetype, rigRef }: MonsterProps) {
  const visualRef = useRef<Group>(null);
  const stats = MONSTER_ARCHETYPES[archetype];
  const parts = MONSTER_PARTS[archetype];

  const materials = useMemo(() => {
    const byKey = new Map<string, MeshStandardMaterial>();
    for (const part of parts) {
      const key = `${part.color}|${part.emissive ?? ''}`;
      if (byKey.has(key)) continue;
      byKey.set(
        key,
        new MeshStandardMaterial({
          color: part.color,
          roughness: 0.9,
          emissive: part.emissive ?? '#000000',
          emissiveIntensity: part.emissive ? 1 : 0,
        })
      );
    }
    return byKey;
  }, [parts]);

  const materialFor = (part: (typeof parts)[number]) =>
    materials.get(`${part.color}|${part.emissive ?? ''}`) ??
    materials.values().next().value!;

  useEffect(() => {
    const owned = [...materials.values()];
    return () => {
      for (const material of owned) material.dispose();
    };
  }, [materials]);

  useImperativeHandle(
    rigRef,
    () => ({
      get visual() {
        return visualRef.current!;
      },
      materials: [...materials.values()],
    }),
    [materials]
  );

  return (
    <group>
      <group ref={visualRef}>
        {parts.map((part, index) => (
          <mesh
            key={index}
            geometry={BOX}
            material={materialFor(part)}
            position={[part.pos[0], part.pos[1], part.pos[2]]}
            scale={[part.size[0], part.size[1], part.size[2]]}
            castShadow={false}
            receiveShadow
          />
        ))}
      </group>
      <mesh
        geometry={BLOB}
        position={[0, 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[stats.radius * 1.3, stats.radius * 1.3, 1]}
        receiveShadow={false}
      >
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.35}
          depthWrite={false}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </group>
  );
}
