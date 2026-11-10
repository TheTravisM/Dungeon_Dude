import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Object3D, SpotLight } from 'three';

/** Spotlight intensity before flicker, in Three's physical light units. */
const BASE_INTENSITY = 70;

/**
 * Drives the handheld torch without allocating per frame. Two fixed-frequency
 * sine waves stand in for flame turbulence, so the motion is deterministic and
 * a given session always looks the same. The light target is assigned once and
 * then follows the hero hierarchy, which keeps the spotlight aimed forward as
 * the hero turns in later steps.
 */
export function useTorchFlicker() {
  const lightRef = useRef<SpotLight>(null);
  const flameRef = useRef<Group>(null);
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
    const flameScale =
      0.95 + Math.sin(time * 17.1) * 0.05 + Math.sin(time * 33.3) * 0.03;

    if (lightRef.current) lightRef.current.intensity = BASE_INTENSITY * flicker;
    if (flameRef.current) {
      flameRef.current.scale.setScalar(flameScale);
      flameRef.current.position.y = Math.sin(time * 9.7) * 0.012;
    }
  });

  return { lightRef, flameRef, targetRef };
}
