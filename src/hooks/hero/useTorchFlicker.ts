import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, PointLight, SpotLight } from 'three';

/** Amber cone intensity before flicker. Kept low so it never tints walls red. */
const SPOT_BASE_INTENSITY = 46;
/** Soft fill intensity before flicker, deliberately much dimmer than the cone. */
const GLOW_BASE_INTENSITY = 5;

interface TorchFlickerOptions {
  spot: RefObject<SpotLight | null>;
  glow: RefObject<PointLight | null>;
  flame: RefObject<Mesh | null>;
}

/**
 * Drives the torch light and flame from one deterministic composite wave.
 *
 * The four unrelated frequencies (0.7, 7, 13, 23 Hz) keep the motion organic
 * without noise. Everything is written through refs, so the loop allocates
 * nothing and never touches React state.
 */
export function useTorchFlicker({
  spot,
  glow,
  flame,
}: TorchFlickerOptions): void {
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker =
      Math.sin(t * 0.7) * 0.03 +
      Math.sin(t * 7) * 0.06 +
      Math.sin(t * 13) * 0.05 +
      Math.sin(t * 23) * 0.04;
    const factor = 1 + flicker;

    const spotLight = spot.current;
    if (spotLight) spotLight.intensity = SPOT_BASE_INTENSITY * factor;

    const glowLight = glow.current;
    if (glowLight) glowLight.intensity = GLOW_BASE_INTENSITY * factor;

    const flameMesh = flame.current;
    if (flameMesh) flameMesh.scale.setScalar(0.92 + flicker * 0.5);
  });
}
