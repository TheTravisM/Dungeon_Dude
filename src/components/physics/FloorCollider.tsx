import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { FLOOR_SIZE, FLOOR_THICKNESS } from '../../game/constants';

/**
 * Invisible collision slab that matches the visual floor. Keeping it separate
 * from Floor.tsx lets the visual component stay a pure mesh while both sides
 * share the same constants.
 */
export default function FloorCollider() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        args={[FLOOR_SIZE / 2, FLOOR_THICKNESS / 2, FLOOR_SIZE / 2]}
        position={[0, -FLOOR_THICKNESS / 2, 0]}
      />
    </RigidBody>
  );
}
