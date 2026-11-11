import { HERO_STUCK_MIN_PROGRESS, HERO_STUCK_WINDOW_MS } from '../constants';
import type { WorldPoint } from '../navigation/heroPath';

/** 0 ok, 1 replan, 2 pick another goal, 3 snap to the cell center. */
export type StuckLevel = 0 | 1 | 2 | 3;

export interface StuckDetector {
  sample(nowMs: number, pos: WorldPoint, wantsToMove: boolean): StuckLevel;
  reset(nowMs: number, pos: WorldPoint): void;
}

/**
 * Time-windowed progress check. Every window compares the current position to
 * the anchor taken at the window start; too little movement while trying to
 * move increments a consecutive counter. Between boundaries the last level is
 * returned unchanged, so one bad window can only escalate one step.
 */
export function createStuckDetector(
  windowMs: number = HERO_STUCK_WINDOW_MS,
  minProgress: number = HERO_STUCK_MIN_PROGRESS
): StuckDetector {
  let windowStart = 0;
  let anchorX = 0;
  let anchorZ = 0;
  let consecutiveStuck = 0;
  let level: StuckLevel = 0;

  return {
    sample(nowMs, pos, wantsToMove) {
      if (nowMs - windowStart < windowMs) return level;

      const moved = Math.hypot(pos.x - anchorX, pos.z - anchorZ);
      if (wantsToMove && moved < minProgress) {
        consecutiveStuck += 1;
        level = Math.min(consecutiveStuck, 3) as StuckLevel;
      } else {
        consecutiveStuck = 0;
        level = 0;
      }

      windowStart = nowMs;
      anchorX = pos.x;
      anchorZ = pos.z;
      return level;
    },

    reset(nowMs, pos) {
      windowStart = nowMs;
      anchorX = pos.x;
      anchorZ = pos.z;
      consecutiveStuck = 0;
      level = 0;
    },
  };
}
