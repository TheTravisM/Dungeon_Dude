import { useRef } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import type { OrthographicCamera as ThreeOrthographicCamera } from 'three';
import {
  CAMERA_OFFSET,
  CAMERA_ZOOM,
  DEBUG_ORBIT_CONTROLS,
} from './cameraConstants';
import { CAMERA_FAR, CAMERA_NEAR } from '../../config/dioramaConfig';

interface IsometricCameraProps {
  zoom?: number;
}

/**
 * Creates the orthographic camera. CameraFollow owns the aim and position
 * during normal play; OrbitControls takes over only when the debug flag is on.
 */
export default function IsometricCamera({
  zoom = CAMERA_ZOOM,
}: IsometricCameraProps) {
  const cameraRef = useRef<ThreeOrthographicCamera>(null);

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={CAMERA_OFFSET}
        zoom={zoom}
        near={CAMERA_NEAR}
        far={CAMERA_FAR}
      />
      {DEBUG_ORBIT_CONTROLS && (
        <OrbitControls makeDefault target={[0, 0, 0]} enableDamping />
      )}
    </>
  );
}
