import type { Vector3Tuple } from 'three';
import TorchLight from './TorchLight';

interface HeroProps {
  /** World position of the hero's feet, matching the dungeon spawn convention. */
  position: Vector3Tuple;
  /** Defaults to a three-quarter view facing the fixed isometric camera. */
  rotationY?: number;
}

/**
 * Hero silhouette built only from primitive boxes. The model is intentionally
 * a separate visual component: movement, ECS registration, physics, input, and
 * AI stay out of it so later steps can wrap this group without rewriting the
 * look. Local forward is -Z and the feet sit at the group origin.
 *
 * Scale is roughly 1.3 world units tall, inside the approved 1.4-unit capsule.
 * Shoulders stay under the 0.28 capsule radius so the model does not visibly
 * clip through one-tile corridors.
 */
export default function Hero({ position, rotationY = -Math.PI * 0.75 }: HeroProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Boots and legs. The gap between them keeps the silhouette readable. */}
      <mesh position={[-0.11, 0.07, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.14, 0.26]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.92} />
      </mesh>
      <mesh position={[0.11, 0.07, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.14, 0.26]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.92} />
      </mesh>
      <mesh position={[-0.11, 0.31, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.34, 0.17]} />
        <meshStandardMaterial color="#2c3646" roughness={0.95} />
      </mesh>
      <mesh position={[0.11, 0.31, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.34, 0.17]} />
        <meshStandardMaterial color="#2c3646" roughness={0.95} />
      </mesh>

      {/* Torso, belt, and a short cloak panel behind the body. */}
      <mesh position={[0, 0.69, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.46, 0.25]} />
        <meshStandardMaterial color="#355a6b" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.49, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.41, 0.08, 0.27]} />
        <meshStandardMaterial color="#5b3b25" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.49, -0.145]} castShadow>
        <boxGeometry args={[0.07, 0.06, 0.02]} />
        <meshStandardMaterial color="#8a94a3" roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.68, 0.17]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.56, 0.07]} />
        <meshStandardMaterial color="#2b5c58" roughness={0.92} />
      </mesh>

      {/* Shoulders, arms, and hands. Right hand holds the torch; left holds the sword. */}
      <mesh position={[-0.235, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.13, 0.12, 0.24]} />
        <meshStandardMaterial color="#244b49" roughness={0.9} />
      </mesh>
      <mesh position={[0.235, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.13, 0.12, 0.24]} />
        <meshStandardMaterial color="#244b49" roughness={0.9} />
      </mesh>
      <mesh position={[-0.245, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.11, 0.32, 0.15]} />
        <meshStandardMaterial color="#2f5060" roughness={0.9} />
      </mesh>
      <mesh position={[0.245, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.11, 0.32, 0.15]} />
        <meshStandardMaterial color="#2f5060" roughness={0.9} />
      </mesh>
      <mesh position={[-0.245, 0.49, -0.01]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.12]} />
        <meshStandardMaterial color="#c58a62" roughness={0.85} />
      </mesh>
      <mesh position={[0.245, 0.49, -0.01]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.12]} />
        <meshStandardMaterial color="#c58a62" roughness={0.85} />
      </mesh>

      {/* Head, hood crown, back hood, and a small visible face plane. */}
      <mesh position={[0, 1.07, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.3, 0.27]} />
        <meshStandardMaterial color="#c58a62" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.235, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.12, 0.32]} />
        <meshStandardMaterial color="#244b49" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.08, 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.32, 0.09]} />
        <meshStandardMaterial color="#244b49" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.03, -0.145]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.02]} />
        <meshStandardMaterial color="#d49a72" roughness={0.8} />
      </mesh>

      {/*
        Torch in the right hand. The group is tilted outward so the handle and
        head clear the arm instead of reading as one dark column. The flame and
        shadow-casting spotlight live in TorchLight.
      */}
      <group position={[0.315, 0.49, -0.02]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.055, 0.5, 0.055]} />
          <meshStandardMaterial color="#4a2f1c" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.075, 0.08, 0.075]} />
          <meshStandardMaterial color="#2b1d12" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.47, 0]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#3a2a1e" roughness={0.7} metalness={0.35} />
        </mesh>
        <group position={[0, 0.56, 0]}>
          <TorchLight />
        </group>
      </group>

      {/*
        Sword in the left hand: leather grip, steel crossguard and pommel, a
        tapered blade, and a small glowing gem. The outward tilt keeps the whole
        silhouette readable from the fixed isometric camera.
      */}
      <group position={[-0.315, 0.49, -0.02]} rotation={[0, 0, 0.14]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.055, 0.2, 0.055]} />
          <meshStandardMaterial color="#4a2f1c" roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.03, 0]} castShadow>
          <boxGeometry args={[0.09, 0.07, 0.09]} />
          <meshStandardMaterial color="#aab6c4" roughness={0.4} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.3, 0.06, 0.08]} />
          <meshStandardMaterial color="#b9c4d2" roughness={0.35} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.53, 0]} castShadow>
          <boxGeometry args={[0.09, 0.56, 0.03]} />
          <meshStandardMaterial color="#dbe5f0" roughness={0.3} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.055, 0.08, 0.03]} />
          <meshStandardMaterial color="#eef4fa" roughness={0.25} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.22, -0.045]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#ffcf7a"
            emissive="#e8a33d"
            emissiveIntensity={1.5}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
