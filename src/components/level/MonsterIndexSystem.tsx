import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  MONSTER_INDEX_HZ,
  monsterIndex,
  rebuildMonsterIndex,
} from '../../game/monsters/monsterIndex';

const INTERVAL = 1 / MONSTER_INDEX_HZ;

/**
 * Keeps the proximity index warm. The first rebuild happens on mount so the
 * first frame can query it; after that the index updates at a fixed 20 Hz and
 * never more than once per frame.
 */
export default function MonsterIndexSystem() {
  // Start full so the first frame after the level's entities mount rebuilds,
  // instead of leaving the index empty until the first 50 ms boundary.
  const accumulator = useRef(INTERVAL);

  useEffect(() => {
    rebuildMonsterIndex();
    return () => monsterIndex.clear();
  }, []);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < INTERVAL) return;
    accumulator.current = Math.min(accumulator.current - INTERVAL, INTERVAL);
    rebuildMonsterIndex();
  });

  return null;
}
