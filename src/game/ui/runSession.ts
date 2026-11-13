import { STARTING_DEPTH, useGameStore } from '../store';
import { useRunSeedStore } from './runSeedStore';

/**
 * Resets the run-level aggregates for a fresh game. Screen state lives in its
 * own store, so this never changes which screen is visible. Called inside the
 * same View Transition callback as the screen event, so the new screen never
 * renders stale depth or totals.
 */
export function resetRunState(): void {
  useRunSeedStore.getState().reroll();
  useGameStore.setState({
    currentDepth: STARTING_DEPTH,
    goldCollected: 0,
    monstersSlain: 0,
    hasKey: false,
    autoPlaying: true,
    lastInputTime: 0,
  });
}
