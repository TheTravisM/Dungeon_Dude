import { useLayoutEffect, useRef } from 'react';
import type { InstancedMesh } from 'three';
import type { DungeonLayout } from '../../types';
import { FLOOR_TILE_HEIGHT } from '../../game/dungeon/constants';
import {
  FLOOR_INSTANCE_STRIDE,
  getFloorInstanceMatrices,
} from '../../game/dungeon/floorInstances';

interface DungeonFloorProps {
  layout: DungeonLayout;
}

/**
 * Draws every walkable cell from one InstancedMesh. Geometry, material, and
 * transforms are shared, so floor complexity costs one draw call instead of one
 * React mesh per tile. Matrices come from a module-level cache and are copied
 * into the instance buffer once per layout.
 */
export default function DungeonFloor({ layout }: DungeonFloorProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const matrices = getFloorInstanceMatrices(layout);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target = mesh.instanceMatrix.array as Float32Array;
    target.set(matrices.subarray(0, layout.floorCells.length * FLOOR_INSTANCE_STRIDE));
    mesh.count = layout.floorCells.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, layout.floorCells.length]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, layout.floorCells.length]}
      receiveShadow
    >
      {/* Unit box: the per-instance matrix applies the FLOOR_TILE_INSET scale,
          so the inset must not be baked into the geometry (double-inset). */}
      <boxGeometry args={[1, FLOOR_TILE_HEIGHT, 1]} />
      <meshStandardMaterial color="#3c4a60" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}
