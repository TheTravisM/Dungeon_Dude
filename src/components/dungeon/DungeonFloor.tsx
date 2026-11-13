import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
import type { DungeonLayout } from '../../types';
import { FLOOR_TILE_HEIGHT } from '../../game/dungeon/constants';
import { FLOOR_TEXTURES } from '../../config/assets';
import {
  FLOOR_INSTANCE_STRIDE,
  getFloorInstanceMatrices,
} from '../../game/dungeon/floorInstances';
import {
  configureDungeonFloorTextures,
  createDungeonFloorMaterial,
} from '../environment/DungeonFloorMaterial';

interface DungeonFloorProps {
  layout: DungeonLayout;
}

/**
 * Draws every walkable cell from one InstancedMesh. Geometry, material, and
 * transforms are shared, so floor complexity costs one draw call instead of one
 * React mesh per tile. Matrices come from a module-level cache and are copied
 * into the instance buffer once per layout. The slight bevel catches the cool
 * key light so tiles read as stone rather than paper.
 */
export default function DungeonFloor({ layout }: DungeonFloorProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrices = getFloorInstanceMatrices(layout);
  const [albedoMap, normalMap, roughnessMap, aoMap] = useTexture([
    FLOOR_TEXTURES.albedo,
    FLOOR_TEXTURES.normal,
    FLOOR_TEXTURES.roughness,
    FLOOR_TEXTURES.ao,
  ]);
  const floorMaterial = useMemo(() => {
    configureDungeonFloorTextures(albedoMap, normalMap, roughnessMap, aoMap);
    return createDungeonFloorMaterial(albedoMap, normalMap, roughnessMap, aoMap);
  }, [albedoMap, normalMap, roughnessMap, aoMap]);
  const geometry = useMemo(
    () => new RoundedBoxGeometry(1, FLOOR_TILE_HEIGHT, 1, 1, 0.018),
    []
  );

  useEffect(() => () => floorMaterial.dispose(), [floorMaterial]);

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
      args={[geometry, floorMaterial, layout.floorCells.length]}
    />
  );
}
