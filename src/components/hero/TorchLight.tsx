import { useTorchFlicker } from './useTorchFlicker';

/**
 * Handheld torch flame and the single shadow-casting light for the hero.
 *
 * One 512px spotlight replaces the expensive six-face point-light shadow map.
 * The spotlight sits at the flame and aims forward and down so it picks out the
 * floor and walls ahead. Flame meshes deliberately do not cast shadows, because
 * a caster at the light origin would block its own beam.
 */
export default function TorchLight() {
  const { lightRef, flameRef, targetRef } = useTorchFlicker();

  return (
    <group>
      <spotLight
        ref={lightRef}
        color="#ff9a4d"
        intensity={70}
        distance={9}
        angle={Math.PI / 4}
        penumbra={0.65}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.2}
        shadow-camera-far={12}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      />

      {/* Aim point in hero-local space: forward, slightly downward. */}
      <object3D ref={targetRef} position={[0, -1.5, -3]} />

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
    </group>
  );
}
