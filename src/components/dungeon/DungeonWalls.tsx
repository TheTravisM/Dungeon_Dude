import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { DungeonLayout } from '../../types';
import { WALL_THICKNESS } from '../../game/dungeon/constants';
import { WALL_TEXTURES } from '../../config/assets';
import { createChippedWallGeometry } from '../environment/chippedWallGeometry';
import {
  configureDungeonWallTextures,
  createDungeonWallMaterial,
} from '../environment/DungeonWallPbrMaterial';
import { getWallInstanceData } from '../../game/dungeon/wallInstances';

interface DungeonWallsProps {
  layout: DungeonLayout;
}

/**
 * One instanced draw call for the whole wall set. Matrix Y scale bakes the
 * tall/low cutaway height into a unit-height chipped block, so both batches
 * share one geometry and one material while still reading as different
 * heights. All per-cell variation is seeded and precomputed.
 */
export default function DungeonWalls({ layout }: DungeonWallsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const instances = getWallInstanceData(layout);
  const [albedoMap, normalMap, roughnessMap, aoMap] = useTexture([
    WALL_TEXTURES.albedo,
    WALL_TEXTURES.normal,
    WALL_TEXTURES.roughness,
    WALL_TEXTURES.ao,
  ]);

  const wallMaterial = useMemo(() => {
    configureDungeonWallTextures(albedoMap, normalMap, roughnessMap, aoMap);
    return createDungeonWallMaterial(albedoMap, normalMap, roughnessMap, aoMap);
  }, [albedoMap, normalMap, roughnessMap, aoMap]);

  const geometry = useMemo(
    () => createChippedWallGeometry(WALL_THICKNESS, 1, layout.seed),
    [layout.seed]
  );

  useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target = mesh.instanceMatrix.array as Float32Array;
    target.set(instances.combined);
    mesh.count = instances.count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [instances]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, wallMaterial, instances.count]}
    />
  );
}
