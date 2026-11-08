import { useEffect, useRef } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import type { OrthographicCamera as ThreeOrthographicCamera } from 'three';

/**
 * Flip this to true while tuning the scene. Orbit controls would fight the
 * fixed game camera during normal play, so this stays off unless we need to
 * inspect geometry from another angle.
 */
const DEBUG_ORBIT_CONTROLS = false;

interface IsometricCameraProps {
  zoom?: number;
}

export default function IsometricCamera({ zoom = 40 }: IsometricCameraProps) {
  const cameraRef = useRef<ThreeOrthographicCamera>(null);

  useEffect(() => {
    // A fresh Three camera looks down its local -Z axis. Placing it on the
    // (1, 1, 1) diagonal and aiming at the origin gives the classic isometric
    // 45 degree heading and 35.26 degree elevation used by diorama games.
    cameraRef.current?.lookAt(0, 0, 0);
  }, []);

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={[20, 20, 20]}
        zoom={zoom}
        near={0.1}
        far={200}
      />
      {DEBUG_ORBIT_CONTROLS && <OrbitControls makeDefault target={[0, 0, 0]} enableDamping />}
    </>
  );
}
