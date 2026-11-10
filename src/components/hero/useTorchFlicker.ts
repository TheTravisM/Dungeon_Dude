import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Object3D, SpotLight } from 'three';

/** Spotlight intensity before flicker, in Three's physical light units. */
const BASE_INTENSITY = 70;

/**
 * Drives the torch spotlight without allocating per frame. Two fixed-frequency
 * sine waves stand in for flame turbulence, so the motion is deterministic and
 * a given session always looks the same. The light target is assigned once and
 * then follows the torch anchor in the scene graph, which keeps the spotlight
 * aimed forward as the hero turns.
 *
 * The spotlight deliberately lives outside the walk-cycle group, so it does
 * not inherit the model's bob. A gentle 8 rad/s sway on the light position
 * keeps the torch feeling alive.
 */
export function useTorchFlicker() {
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);

  useEffect(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target) return;

    light.target = target;
    target.updateMatrixWorld();
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const flicker =
      0.9 + Math.sin(time * 11.3) * 0.06 + Math.sin(time * 27.7) * 0.04;

    const light = lightRef.current;
    if (light) {
      light.intensity = BASE_INTENSITY * flicker;
      // Subtle torch sway: the beam gently bobs as the hero walks. The base
      // position is the torch anchor, so this oscillates around it.
      light.position.y = Math.sin(time * 8) * 0.05;
    }
  });

  return { lightRef, targetRef };
}

/**
 * Drives the flame meshes in the hero's hand. The flame is visual only and
 * lives inside the walk-cycle group, so it bobs with the hand while the
 * spotlight it mimics stays put.
 */
export function useFlameFlicker() {
  const flameRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const flameScale =
      0.95 + Math.sin(time * 17.1) * 0.05 + Math.sin(time * 33.3) * 0.03;

    if (flameRef.current) {
      flameRef.current.scale.setScalar(flameScale);
      flameRef.current.position.y = Math.sin(time * 9.7) * 0.012;
    }
  });

  return { flameRef };
}
