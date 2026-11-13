import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Euler,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from 'three';
import { useGameStore } from '../../game/store';
import { FLOOR_MAX_JITTER } from '../../config/dioramaConfig';
import { monsterQuery } from '../../game/ecs';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';
import { FLOOR_TOP } from '../../game/dungeon/constants';
import { getBlobTexture } from '../environment/blobTexture';

const MAX_BLOBS = 64;

/** Module scratch objects so the frame loop allocates nothing. */
const matrix = new Matrix4();
const position = new Vector3();
const scale = new Vector3();
const FLAT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));

/**
 * One instanced draw call for every monster contact decal. Monsters already
 * share a floor plane, so updating instance matrices for living entities is
 * cheaper than one transparent mesh per actor once the population grows.
 */
export default function MonsterBlobs() {
  const meshRef = useRef<InstancedMesh>(null);
  const depth = useGameStore((state) => state.currentDepth);

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: getBlobTexture(),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  // A depth change swaps the monster set; the next frame rebuilds the buffer.
  useEffect(() => undefined, [depth]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    let count = 0;
    for (const entity of monsterQuery.entities) {
      if (count >= MAX_BLOBS) break;
      if (entity.state === 'dead') continue;

      const stats = MONSTER_ARCHETYPES[entity.archetype ?? 'slime'];
      const size = stats.radius * 2.8;
      position.set(
        entity.position?.x ?? 0,
        FLOOR_TOP + FLOOR_MAX_JITTER + 0.012,
        entity.position?.z ?? 0
      );
      scale.set(size, size, 1);
      matrix.compose(position, FLAT, scale);
      mesh.setMatrixAt(count, matrix);
      count++;
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, material, MAX_BLOBS]}
      renderOrder={2}
      raycast={() => undefined}
    >
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}
