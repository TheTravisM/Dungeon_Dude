import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { DungeonLayout } from '../../types';
import { FLOOR_TILE_HEIGHT } from '../../game/dungeon/constants';
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
 * into the instance buffer once per layout.
 */
export default function DungeonFloor({ layout }: DungeonFloorProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrices = getFloorInstanceMatrices(layout);
  const [albedoMap, normalMap, roughnessMap, aoMap] = useTexture([
    '/assets/textures/floor_bricks_02_diff_2k.jpg',
    '/assets/textures/floor_bricks_02_nor_gl_2k.jpg',
    '/assets/textures/floor_bricks_02_rough_2k.jpg',
    '/assets/textures/floor_bricks_02_ao_2k.jpg',
  ]);
  const floorMaterial = useMemo(() => {
    configureDungeonFloorTextures(albedoMap, normalMap, roughnessMap, aoMap);
    return createDungeonFloorMaterial(albedoMap, normalMap, roughnessMap, aoMap);
  }, [albedoMap, normalMap, roughnessMap, aoMap]);
  const geometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(1, FLOOR_TILE_HEIGHT, 1);
    boxGeometry.setAttribute('uv2', boxGeometry.getAttribute('uv'));
    return boxGeometry;
  }, []);

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
      receiveShadow
    />
  );
}
