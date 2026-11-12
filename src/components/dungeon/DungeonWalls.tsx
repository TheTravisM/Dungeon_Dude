import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { DungeonLayout } from '../../types';
import {
  WALL_HEIGHT_LOW,
  WALL_HEIGHT_TALL,
  WALL_THICKNESS,
} from '../../game/dungeon/constants';
import { getWallInstanceData } from '../../game/dungeon/wallInstances';
import { createDungeonWallMaterial } from '../environment/WallShaderMaterial';

interface DungeonWallsProps {
  layout: DungeonLayout;
}

interface WallBatchProps {
  matrices: Float32Array;
  count: number;
  height: number;
  material: THREE.MeshStandardMaterial;
}

/** Builds the 1-segment wall box; the shader does all relief in-fragment. */
function createWallGeometry(height: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(WALL_THICKNESS, height, WALL_THICKNESS);
}

/**
 * One instanced draw call for a height category. The geometry owns the wall
 * height, so an instance transform only places the cell. Both batches share
 * the same PBR material instance; per-cell stone variation comes from the
 * world-space triplanar pattern in the material, not from instance colors.
 */
function WallBatch({ matrices, count, height, material }: WallBatchProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createWallGeometry(height), [height]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target = mesh.instanceMatrix.array as Float32Array;
    target.set(matrices.subarray(0, count * 16));
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, count]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Renders the precomputed wall cells in two batches. Tall walls form the far
 * backdrop; low ledges keep the near and interior boundaries readable from the
 * fixed camera. No transparency or per-frame occlusion test is involved.
 */
export default function DungeonWalls({ layout }: DungeonWallsProps) {
  const instances = getWallInstanceData(layout);

  // One PBR material shared by both batches. Its onBeforeCompile hook injects
  // the triplanar stone albedo and the perturbed surface normal into
  // Three.js's standard lighting pipeline, so native torch, point, and
  // directional lights illuminate the walls and shadow the stone relief.
  // No texture work or material allocation happens during a frame.
  const wallMaterial = useMemo(() => createDungeonWallMaterial(), []);

  return (
    <group>
      <WallBatch
        matrices={instances.tall}
        count={instances.tallCount}
        height={WALL_HEIGHT_TALL}
        material={wallMaterial}
      />
      <WallBatch
        matrices={instances.low}
        count={instances.lowCount}
        height={WALL_HEIGHT_LOW}
        material={wallMaterial}
      />
    </group>
  );
}