import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { Vector3 } from 'three';
import { FLOOR_TOP } from '../../game/dungeon/constants';
import { heroQuery } from '../../game/ecs';
import {
  CAMERA_OFFSET,
  DEBUG_ORBIT_CONTROLS,
} from './cameraConstants';

/** Look-ahead distance in seconds of hero velocity. */
const LOOK_AHEAD = 0.15;
/** Focus height above the floor; keeps the aim point around the hero's chest. */
const FOCUS_Y = FLOOR_TOP + 0.5;
/** Smoothing time for the focus point, in seconds. */
const FOCUS_SMOOTH_TIME = 0.25;

interface CameraFocusState {
  focus: Vector3;
  target: Vector3;
  initialized: boolean;
}

/**
 * Keeps the fixed isometric camera aimed at the hero. The camera keeps the
 * same offset and angle; only its focus follows, with damping and a small
 * velocity lead. Orbit controls own the camera when the debug flag is on.
 */
export default function CameraFollow() {
  const stateRef = useRef<CameraFocusState | null>(null);

  if (stateRef.current === null) {
    stateRef.current = {
      focus: new Vector3(),
      target: new Vector3(),
      initialized: false,
    };
  }

  useFrame(({ camera }, delta) => {
    if (DEBUG_ORBIT_CONTROLS) return;

    const hero = heroQuery.first;
    const heroPosition = hero?.position;
    const focusState = stateRef.current;
    if (!heroPosition || !focusState) return;

    const velocity = hero?.velocity;
    focusState.target.set(
      heroPosition.x + (velocity ? velocity[0] * LOOK_AHEAD : 0),
      FOCUS_Y,
      heroPosition.z + (velocity ? velocity[2] * LOOK_AHEAD : 0)
    );

    if (!focusState.initialized) {
      focusState.focus.copy(focusState.target);
      focusState.initialized = true;
    } else {
      easing.damp3(
        focusState.focus,
        focusState.target,
        FOCUS_SMOOTH_TIME,
        delta
      );
    }

    camera.position.set(
      focusState.focus.x + CAMERA_OFFSET[0],
      focusState.focus.y + CAMERA_OFFSET[1],
      focusState.focus.z + CAMERA_OFFSET[2]
    );
    camera.lookAt(focusState.focus);
  });

  return null;
}
