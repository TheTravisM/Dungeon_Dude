import { Grid } from '@react-three/drei';
import { FLOOR_SIZE, FLOOR_THICKNESS } from '../../game/constants';

/**
 * One world unit equals one dungeon tile. This 20 by 20 preview floor gives
 * Step 4's room generator plenty of space, while the grid makes the isometric
 * projection legible before any walls exist. Dimensions come from shared
 * constants so the physics collider always matches this mesh.
 */
export default function Floor() {
  return (
    <group>
      <mesh position={[0, -FLOOR_THICKNESS / 2, 0]} receiveShadow>
        <boxGeometry args={[FLOOR_SIZE, FLOOR_THICKNESS, FLOOR_SIZE]} />
        <meshStandardMaterial color="#2b3342" roughness={0.95} metalness={0.05} />
      </mesh>

      <Grid
        args={[FLOOR_SIZE, FLOOR_SIZE]}
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#46566e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#7089a8"
        fadeDistance={60}
        fadeStrength={1.5}
        infiniteGrid={false}
        followCamera={false}
      />
    </group>
  );
}
