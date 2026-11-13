import { useMemo } from 'react';
import { Sparkles } from '@react-three/drei';
import type { DungeonLayout } from '../../types';
import { generateDecor } from '../../game/dungeon/decor';
import { FLOOR_TOP } from '../../game/dungeon/constants';
import DecalBatch from './decor/DecalBatch';
import PropBatches from './decor/PropBatches';
import {
  Altars,
  Braziers,
  Chests,
  Prisons,
  Sconces,
} from './decor/Landmarks';

interface DungeonDecorProps {
  layout: DungeonLayout;
}

/**
 * All cosmetic dungeon dressing. Everything is generated from the layout seed,
 * so a reload creates a new arrangement while collisions and navigation stay
 * driven only by the floor grid. Shared primitives are batched with drei
 * `Instances` to keep the draw-call count flat.
 */
export default function DungeonDecor({ layout }: DungeonDecorProps) {
  const decor = useMemo(() => generateDecor(layout), [layout]);

  return (
    <>
      <PropBatches props={decor.props} />
      <DecalBatch kind="moss" items={decor.decals} />
      <DecalBatch kind="puddle" items={decor.decals} />
      <DecalBatch kind="crack" items={decor.decals} />
      <Braziers items={decor.braziers} />
      <Sconces items={decor.sconces} />
      <Chests items={decor.chests} />
      <Altars items={decor.altars} />
      <Prisons items={decor.prisons} />
      <Sparkles
        count={90}
        position={[0, FLOOR_TOP + 0.7, 0]}
        scale={[layout.size * 0.7, 0.9, layout.size * 0.7]}
        speed={0.18}
        size={0.55}
        opacity={0.3}
        color="#ffb067"
        noise={[0.6, 0.12, 0.6]}
      />
    </>
  );
}
