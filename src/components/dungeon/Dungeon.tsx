import type { DungeonLayout } from '../../types';
import { Sparkles } from '@react-three/drei';
import DungeonCollider from './DungeonCollider';
import DungeonFloor from './DungeonFloor';
import DungeonPlinth from './DungeonPlinth';
import DungeonWalls from './DungeonWalls';
import { FLOOR_TOP } from '../../game/dungeon/constants';

interface DungeonProps {
  layout: DungeonLayout;
}

/**
 * Composes the generated layout into the scene. All four children receive the
 * same immutable layout, so the visible floor, visible walls, and collision
 * shapes cannot describe different dungeons. Generation itself stays in pure
 * modules under `src/game/dungeon`.
 */
export default function Dungeon({ layout }: DungeonProps) {
  return (
    <group>
      <DungeonPlinth />
      <DungeonFloor layout={layout} />
      <DungeonWalls layout={layout} />
      <DungeonCollider layout={layout} />
      <Sparkles
        count={180}
        position={[0, FLOOR_TOP + 1.1, 0]}
        scale={[layout.size * 0.85, 1.6, layout.size * 0.85]}
        speed={0.12}
        size={1.2}
        opacity={0.16}
        color="#b8c5d8"
        noise={[0.2, 0.5, 0.2]}
      />
    </group>
  );
}
