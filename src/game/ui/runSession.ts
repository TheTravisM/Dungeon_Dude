import { STARTING_DEPTH, useGameStore } from '../store';

/**
 * Resets the run-level aggregates for a fresh game. Screen state lives in its
 * own store, so this never changes which screen is visible. Called inside the
 * same View Transition callback as the screen event, so the new screen never
 * renders stale depth or totals.
 */
export function resetRunState(): void {
  useGameStore.setState({
    currentDepth: STARTING_DEPTH,
    goldCollected: 0,
    monstersSlain: 0,
    hasKey: false,
    autoPlaying: true,
    lastInputTime: 0,
  });
}
