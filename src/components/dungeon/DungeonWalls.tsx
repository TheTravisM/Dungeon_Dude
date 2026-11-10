import { useLayoutEffect, useRef } from 'react';
import type { InstancedMesh } from 'three';
import type { DungeonLayout } from '../../types';
import {
  WALL_HEIGHT_LOW,
  WALL_HEIGHT_TALL,
  WALL_THICKNESS,
} from '../../game/dungeon/constants';
import { getWallInstanceData } from '../../game/dungeon/wallInstances';

interface DungeonWallsProps {
  layout: DungeonLayout;
}

interface WallBatchProps {
  matrices: Float32Array;
  count: number;
  height: number;
  color: string;
}

/**
 * One instanced draw call for a height category. The geometry owns the wall
 * height, so an instance transform only places the cell; that keeps the stone
 * pattern consistent instead of stretching it across merged runs.
 */
function WallBatch({ matrices, count, height, color }: WallBatchProps) {
  const meshRef = useRef<InstancedMesh>(null);

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
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[WALL_THICKNESS, height, WALL_THICKNESS]} />
      <meshStandardMaterial color={color} roughness={0.92} metalness={0.04} />
    </instancedMesh>
  );
}

/**
 * Renders the precomputed wall cells in two batches. Tall walls form the far
 * backdrop; low ledges keep the near and interior boundaries readable from the
 * fixed camera. No transparency or per-frame occlusion test is involved.
 */
export default function DungeonWalls({ layout }: DungeonWallsProps) {
  const instances = getWallInstanceData(layout);

  return (
    <group>
      <WallBatch
        matrices={instances.tall}
        count={instances.tallCount}
        height={WALL_HEIGHT_TALL}
        color="#3a4150"
      />
      <WallBatch
        matrices={instances.low}
        count={instances.lowCount}
        height={WALL_HEIGHT_LOW}
        color="#4b5568"
      />
    </group>
  );
}
