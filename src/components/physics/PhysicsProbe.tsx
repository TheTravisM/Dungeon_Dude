import { RigidBody } from '@react-three/rapier';

/**
 * Temporary Step 3 probe. It spawns above the floor and falls under gravity,
 * proving that the Rapier world, the fixed timestep, and the floor collider
 * are all active. Remove this component when Step 4 supplies real dungeon
 * geometry and Step 5 supplies the hero.
 */
export default function PhysicsProbe() {
  return (
    <RigidBody colliders="cuboid" position={[0, 4, 0]} rotation={[0.2, 0.4, 0.1]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#c97b4a" roughness={0.8} metalness={0.05} />
      </mesh>
    </RigidBody>
  );
}
