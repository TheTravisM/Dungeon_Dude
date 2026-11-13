import { useEffect } from 'react';
import { Sparkles } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { DungeonLayout } from '../../types';
import { FLOOR_TOP } from '../../game/dungeon/constants';

interface DungeonAtmosphereProps {
  layout: DungeonLayout;
}

/**
 * Cheap scene-wide atmosphere: a linear depth fog that softens distant halls,
 * cool dust motes that catch the key light, and warm embers drifting above the
 * floor. The fog range is measured from the fixed isometric camera, so the
 * hero's immediate tiles stay crisp while the far side of a large floor recedes.
 */
export default function DungeonAtmosphere({ layout }: DungeonAtmosphereProps) {
  const scene = useThree((state) => state.scene);

  // A `fog` element inside this group would attach to the group, not the
  // scene, so the fog object is installed on the scene explicitly.
  useEffect(() => {
    const fog = new THREE.Fog('#0b0e14', 42, 104);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene]);

  return (
    <>

      <Sparkles
        count={320}
        position={[0, FLOOR_TOP + 1.4, 0]}
        scale={[layout.size * 0.92, 2.6, layout.size * 0.92]}
        speed={0.1}
        size={1}
        opacity={0.14}
        color="#b8c5d8"
        noise={[0.3, 0.6, 0.3]}
      />
      <Sparkles
        count={70}
        position={[0, FLOOR_TOP + 0.35, 0]}
        scale={[layout.size * 0.62, 0.5, layout.size * 0.62]}
        speed={0.06}
        size={0.55}
        opacity={0.22}
        color="#f0a060"
        noise={[0.5, 0.08, 0.5]}
      />
    </>
  );
}
