import { useLayoutEffect, useMemo, useRef } from 'react';
import type { InstancedMesh, Texture } from 'three';
import type { DungeonLayout } from '../../types';
import {
  WALL_HEIGHT_LOW,
  WALL_HEIGHT_TALL,
  WALL_THICKNESS,
} from '../../game/dungeon/constants';
import { getWallInstanceData } from '../../game/dungeon/wallInstances';
import {
  createProceduralBumpTexture,
  createProceduralStoneTexture,
} from '../../game/textures';

interface DungeonWallsProps {
  layout: DungeonLayout;
}

interface WallBatchProps {
  matrices: Float32Array;
  count: number;
  height: number;
  map: Texture | null;
  bumpMap: Texture | null;
}

/**
 * One instanced draw call for a height category. The geometry owns the wall
 * height, so an instance transform only places the cell; that keeps the stone
 * pattern consistent instead of stretching it across merged runs. Both batches
 * share the same procedural textures, so the canvas generation runs once.
 */
function WallBatch({ matrices, count, height, map, bumpMap }: WallBatchProps) {
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
      <meshStandardMaterial
        map={map ?? undefined}
        bumpMap={bumpMap ?? undefined}
        bumpScale={0.04}
        roughness={0.55}
        metalness={0.04}
      />
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

  // Textures are generated in canvas once per mount and reused by both wall
  // batches. useMemo prevents any regeneration during React re-renders.
  const textures = useMemo(
    () => ({
      stone: createProceduralStoneTexture(),
      bump: createProceduralBumpTexture(),
    }),
    []
  );

  return (
    <group>
      <WallBatch
        matrices={instances.tall}
        count={instances.tallCount}
        height={WALL_HEIGHT_TALL}
        map={textures.stone}
        bumpMap={textures.bump}
      />
      <WallBatch
        matrices={instances.low}
        count={instances.lowCount}
        height={WALL_HEIGHT_LOW}
        map={textures.stone}
        bumpMap={textures.bump}
      />
    </group>
  );
}
