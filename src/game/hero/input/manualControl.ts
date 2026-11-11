import { HERO_IDLE_RETURN_MS } from '../constants';

export interface ManualClock {
  registerInput(nowMs: number): void;
  isManual(nowMs: number): boolean;
  lastActiveAt(): number;
}

/**
 * The single source of truth for the four-second manual-control rule.
 * Starting at `-Infinity` means the hero begins in auto mode.
 */
export function createManualClock(idleMs: number = HERO_IDLE_RETURN_MS): ManualClock {
  let lastActive = -Infinity;

  return {
    registerInput(nowMs) {
      lastActive = nowMs;
    },
    isManual(nowMs) {
      return nowMs - lastActive < idleMs;
    },
    lastActiveAt() {
      return lastActive;
    },
  };
}
