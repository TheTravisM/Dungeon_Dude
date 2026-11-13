import type { DungeonLayout, Entity } from '../../types';
import CombatSystem from '../combat/CombatSystem';
import DamageNumbers from '../combat/DamageNumbers';
import MonsterActor from '../monsters/MonsterActor';
import MonsterBlobs from '../monsters/MonsterBlobs';
import MonsterSystem from '../monsters/MonsterSystem';
import MonsterIndexSystem from './MonsterIndexSystem';
import PoiMarker from './PoiMarker';
import { useLevelEntities } from '../../hooks/useLevelEntities';
import { useGameStore } from '../../game/store';

interface LevelEntitiesProps {
  layout: DungeonLayout;
}

/**
 * Level population: monster actor bodies, the shared monster physics system,
 * the proximity index, combat resolution, damage numbers, and the key/stairs
 * markers.
 */
export default function LevelEntities({ layout }: LevelEntitiesProps) {
  const depth = useGameStore((state) => state.currentDepth);
  const { monsters, pois } = useLevelEntities(layout, depth);

  return (
    <>
      <MonsterIndexSystem />
      <MonsterSystem />
      <MonsterBlobs />
      <CombatSystem />
      <DamageNumbers />
      {monsters.map((entity) => (
        <MonsterActor key={entity.id} entity={entity} />
      ))}
      {pois.map((entity: Entity) => (
        <PoiMarker
          key={entity.id}
          kind={entity.poiType === 'stairs' ? 'stairs' : 'key'}
          position={[
            entity.position?.x ?? 0,
            entity.position?.y ?? 0,
            entity.position?.z ?? 0,
          ]}
        />
      ))}
    </>
  );
}
