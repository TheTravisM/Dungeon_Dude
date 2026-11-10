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
    // Multi-frequency flicker (05-07-01): prime multipliers 17 and 23 keep
    // the composite wave from visibly repeating. The contract's reference
    // `2.0 + flicker` is written in legacy light units; this project renders
    // in physical units, so the same wave is scaled onto the physical base
    // intensity (identical relative depth: base +/- 15%).
    const flicker = Math.sin(time * 17) * 0.15 + Math.cos(time * 23) * 0.15;

    const light = lightRef.current;
    if (light) {
      light.intensity = BASE_INTENSITY * (1 + flicker / 2);
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
