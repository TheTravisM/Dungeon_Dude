import { useFlameFlicker, useTorchFlicker } from './useTorchFlicker';

/**
 * The single shadow-casting light for the hero.
 *
 * One 512px spotlight replaces the expensive six-face point-light shadow map.
 * It sits at the flame height and aims forward and down so it picks out the
 * floor and walls ahead. It is anchored directly to the hero's rigid body
 * (outside the walk-cycle group) so the beam stays stable while the model
 * bobs; the anchor is rotated toward the hero's heading each frame.
 */
export default function TorchLight() {
  const { lightRef, targetRef } = useTorchFlicker();

  return (
    <>
      <spotLight
        ref={lightRef}
        color="#ffb74d"
        intensity={70}
        distance={9}
        angle={0.7}
        penumbra={0.5}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.2}
        shadow-camera-far={12}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      />

      {/* Aim point in anchor-local space: forward, slightly downward. */}
      <object3D ref={targetRef} position={[0, -1.5, -3]} />
    </>
  );
}

/**
 * Flame meshes held in the hero's hand. Purely visual: they live inside the
 * walk-cycle group so they bob with the hand, while the spotlight they
 * imitate stays anchored to the rigid body. Flame meshes deliberately do not
 * cast shadows, because a caster at the light origin would block its beam.
 */
export function TorchFlame() {
  const { flameRef } = useFlameFlicker();

  return (
    <group ref={flameRef}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.13, 0.2, 0.13]} />
        <meshStandardMaterial
          color="#ff7a1a"
          emissive="#ff5a00"
          emissiveIntensity={2.4}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.075, 0.14, 0.075]} />
        <meshStandardMaterial
          color="#ffd166"
          emissive="#ffb347"
          emissiveIntensity={3.2}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.09, 0.05]} />
        <meshStandardMaterial
          color="#ffe6a1"
          emissive="#ffc04d"
          emissiveIntensity={3.6}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}
