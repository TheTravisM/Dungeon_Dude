import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { DungeonLayout } from '../../types';
import {
  WALL_HEIGHT_LOW,
  WALL_HEIGHT_TALL,
  WALL_THICKNESS,
} from '../../game/dungeon/constants';
import { getWallInstanceData } from '../../game/dungeon/wallInstances';
import { createProceduralStoneTextures } from '../../game/textures';

interface DungeonWallsProps {
  layout: DungeonLayout;
}

interface WallBatchProps {
  matrices: Float32Array;
  count: number;
  height: number;
  material: THREE.Material;
  /** Vertical UV span. Low ledges show one stone course instead of two. */
  uvScaleY?: number;
}

/** Builds the wall box and lets each height category set its own UV span. */
function createWallGeometry(height: number, uvScaleY: number): THREE.BoxGeometry {
  const geometry = new THREE.BoxGeometry(WALL_THICKNESS, height, WALL_THICKNESS);

  if (uvScaleY !== 1) {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, uv.getY(i) * uvScaleY);
    }
    uv.needsUpdate = true;
  }

  return geometry;
}

/**
 * One instanced draw call for a height category. The geometry owns the wall
 * height, so an instance transform only places the cell. Both batches receive
 * the same material instance, and each cell gets a subtle instance tint so the
 * slab layout does not read as a repeated stamp.
 */
function WallBatch({
  matrices,
  count,
  height,
  material,
  uvScaleY = 1,
}: WallBatchProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(
    () => createWallGeometry(height, uvScaleY),
    [height, uvScaleY]
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target = mesh.instanceMatrix.array as Float32Array;
    target.set(matrices.subarray(0, count * 16));
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // Cycle a slate, blue, and purple tint per wall cell. The albedo stays
    // neutral, so neighbouring cells vary without any extra texture.
    const tints = [
      [0.92, 0.97, 1.06],
      [0.62, 0.8, 1.18],
      [0.82, 0.68, 1.16],
    ] as const;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = matrices[i * 16 + 12];
      const z = matrices[i * 16 + 14];
      const hash =
        Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      const cellX = Math.round(x * 2);
      const cellZ = Math.round(z * 2);
      const tone = (((cellX + cellZ * 2) % 3) + 3) % 3;
      const [r, g, b] = tints[tone];
      const brightness = 0.9 + hash * 0.16;
      color.setRGB(r * brightness, g * brightness, b * brightness);
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
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

  // Generate the canvas maps once and share one material across both wall
  // batches. No texture work or material allocation happens during a frame.
  const wallMaterial = useMemo(() => {
    const maps = createProceduralStoneTextures();
    const material = new THREE.MeshStandardMaterial({
      map: maps.albedo ?? undefined,
      normalMap: maps.normal ?? undefined,
      roughnessMap: maps.roughness ?? undefined,
      roughness: 1,
      metalness: 0.04,
    });
    material.normalScale.set(1.0, 1.0);
    return material;
  }, []);

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
        uvScaleY={0.5}
      />
    </group>
  );
}
