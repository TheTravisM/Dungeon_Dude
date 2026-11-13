import {
  PLINTH_HEIGHT,
  PLINTH_SIZE,
  PLINTH_TRIM_WIDTH,
} from '../../game/dungeon/constants';

/**
 * The stone block that turns the playable floor into a miniature object. The
 * top sits exactly at y = 0 so floor tiles and walls rest on it without a gap.
 * The trim is four thin rails slightly proud of the sides; using rails instead
 * of a full top slab leaves the plinth top dark so the walkable floor remains
 * the brightest surface. The trim never reaches the playable surface, so it
 * cannot cover tiles, openings, or entrances.
 */
export default function DungeonPlinth() {
  const trimHeight = PLINTH_TRIM_WIDTH;
  const trimCenter = PLINTH_SIZE / 2 - trimHeight / 2 + 0.03;
  const longRail = PLINTH_SIZE + 0.06;
  // Stop the side rails at the inner edge of the front/back rails so the two
  // coplanar top faces meet instead of overlapping and z-fighting at corners.
  const shortRail = PLINTH_SIZE - trimHeight * 2 + 0.06;

  return (
    <group>
      {/* The plinth must not cast a shadow onto the thin floor plates just above
          it. Its huge top face in the shadow map can otherwise read as acne on
          the walkable surface. */}
      <mesh position={[0, -PLINTH_HEIGHT / 2, 0]}>
        <boxGeometry args={[PLINTH_SIZE, PLINTH_HEIGHT, PLINTH_SIZE]} />
        <meshStandardMaterial color="#1d222b" roughness={0.96} metalness={0.03} />
      </mesh>

      <mesh position={[0, -trimHeight / 2, trimCenter]}>
        <boxGeometry args={[longRail, trimHeight, trimHeight]} />
        <meshStandardMaterial color="#7c6a52" roughness={0.85} metalness={0.08} />
      </mesh>
      <mesh position={[0, -trimHeight / 2, -trimCenter]}>
        <boxGeometry args={[longRail, trimHeight, trimHeight]} />
        <meshStandardMaterial color="#7c6a52" roughness={0.85} metalness={0.08} />
      </mesh>
      <mesh position={[trimCenter, -trimHeight / 2, 0]}>
        <boxGeometry args={[trimHeight, trimHeight, shortRail]} />
        <meshStandardMaterial color="#7c6a52" roughness={0.85} metalness={0.08} />
      </mesh>
      <mesh position={[-trimCenter, -trimHeight / 2, 0]}>
        <boxGeometry args={[trimHeight, trimHeight, shortRail]} />
        <meshStandardMaterial color="#7c6a52" roughness={0.85} metalness={0.08} />
      </mesh>
    </group>
  );
}
