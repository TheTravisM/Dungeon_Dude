import { useLayoutEffect, useRef } from 'react';
import { Sparkles } from '@react-three/drei';
import type { Mesh, Object3D, PointLight, SpotLight } from 'three';
import { useTorchFlicker } from '../../hooks/hero/useTorchFlicker';

/**
 * Handheld torch effect: one spotlight, one fill point light, a tiny emissive
 * flame, and rising embers. The light is a soft amber so it accents the cool
 * stone instead of washing it toward red. The spotlight is unshadowed;
 * contact grounding comes from the blob decal instead.
 *
 * Rendered inside the `torchHand` group, so it inherits the raised arm. The
 * spotlight target is a sibling in the same group (contract 6.6) and aims at
 * the floor just in front of the hero.
 */
export default function HeroTorch() {
  const spotRef = useRef<SpotLight>(null);
  const glowRef = useRef<PointLight>(null);
  const flameRef = useRef<Mesh>(null);
  const targetRef = useRef<Object3D>(null);

  useLayoutEffect(() => {
    const spot = spotRef.current;
    const target = targetRef.current;
    if (!spot || !target) return;

    spot.target = target;
    target.updateMatrixWorld();
  }, []);

  useTorchFlicker({ spot: spotRef, glow: glowRef, flame: flameRef });

  return (
    <group>
      <spotLight
        ref={spotRef}
        color="#ffcf9a"
        intensity={46}
        angle={Math.PI / 2.4}
        penumbra={0.9}
        distance={14}
        decay={1.6}
        position={[0, 0.1, 0]}
      />

      {/* Aim point on the floor in front of and below the torch. */}
      <object3D ref={targetRef} position={[0, -1.3, 0.4]} />

      {/* Soft fill only. */}
      <pointLight
        ref={glowRef}
        color="#ffbe82"
        intensity={5}
        distance={6}
        decay={2}
      />

      <mesh ref={flameRef} position={[0, 0.26, 0]}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshBasicMaterial color="#ffcf70" toneMapped={false} />
      </mesh>

      <Sparkles
        count={14}
        speed={0.6}
        size={3}
        scale={[0.25, 0.8, 0.25]}
        color="#ff8a2a"
        opacity={0.9}
        noise={0.6}
        position={[0, 0.35, 0]}
      />
    </group>
  );
}
