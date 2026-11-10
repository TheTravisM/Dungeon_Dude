import type { DungeonLayout } from '../../types';
import DungeonCollider from './DungeonCollider';
import DungeonFloor from './DungeonFloor';
import DungeonPlinth from './DungeonPlinth';
import DungeonWalls from './DungeonWalls';

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
    </group>
  );
}
