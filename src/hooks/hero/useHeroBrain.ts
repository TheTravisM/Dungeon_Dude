import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { heroQuery } from '../../game/ecs';
import { createHeroBrain, type HeroBrain } from '../../game/hero/ai/heroBrain';
import { HERO_BRAIN_HZ } from '../../game/hero/constants';
import { isManualNow } from '../../game/hero/input/inputState';
import type { WorldPoint } from '../../game/hero/navigation/heroPath';
import { clearRoute } from '../../game/hero/navigation/routeState';
import type { DungeonLayout } from '../../types';
import { requestSnapToCell } from './useHeroMovement';

const TICK_INTERVAL = 1 / HERO_BRAIN_HZ;

/** Scratch position shared by brain calls; never stored on the route. */
const scratchPosition: WorldPoint = { x: 0, z: 0 };

function getHeroPosition(): WorldPoint {
  const position = heroQuery.first?.position;
  if (position) {
    scratchPosition.x = position.x;
    scratchPosition.z = position.z;
  }
  return scratchPosition;
}

/**
 * Steps the autonomous brain at a fixed rate, independent of frame rate. The
 * tree is never stepped while manual control is active: the first manual tick
 * resets it and drops the route, and stepping resumes only after the manual
 * window expires. The accumulator starts full so the first frame plans a route.
 */
export function useHeroBrain(layout: DungeonLayout): void {
  const brain = useMemo<HeroBrain>(
    () => createHeroBrain(layout, getHeroPosition, requestSnapToCell),
    [layout]
  );

  const accumulator = useRef(TICK_INTERVAL);
  const wasManual = useRef(false);

  // A new layout gets a fresh brain, so the shared module route must not leak
  // waypoints from the previous floor into this one.
  useEffect(() => {
    clearRoute();
    return () => clearRoute();
  }, [layout]);

  useFrame((_, delta) => {
    accumulator.current += delta;
    if (accumulator.current < TICK_INTERVAL) return;

    // Drop excess time so a stalled tab cannot burst several ticks at once.
    accumulator.current = Math.min(
      accumulator.current - TICK_INTERVAL,
      TICK_INTERVAL
    );

    const now = performance.now();
    if (isManualNow(now)) {
      if (!wasManual.current) {
        brain.onManualTakeover(now);
        wasManual.current = true;
      }
      return;
    }

    wasManual.current = false;
    brain.tick(now);
  });
}
