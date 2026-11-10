import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { DungeonLayout } from '../../types';
import { getDungeonColliderSpecs } from '../../game/dungeon/colliders';

interface DungeonColliderProps {
  layout: DungeonLayout;
}

/**
 * The single fixed rigid body for all static level geometry. Floor rectangles,
 * merged wall runs, and the plinth are child colliders of one body, so the
 * Rapier broad phase sees one static object instead of hundreds of per-tile
 * bodies. Positions are local to the body, whose origin is the world origin.
 */
export default function DungeonCollider({ layout }: DungeonColliderProps) {
  const specs = getDungeonColliderSpecs(layout);

  return (
    <RigidBody type="fixed" colliders={false}>
      {specs.floorColliders.map((collider, index) => (
        <CuboidCollider
          key={`floor-${index}`}
          args={collider.halfExtents}
          position={collider.position}
        />
      ))}
      {specs.wallColliders.map((collider, index) => (
        <CuboidCollider
          key={`wall-${index}`}
          args={collider.halfExtents}
          position={collider.position}
        />
      ))}
      <CuboidCollider
        key="plinth"
        args={specs.plinthCollider.halfExtents}
        position={specs.plinthCollider.position}
      />
    </RigidBody>
  );
}
