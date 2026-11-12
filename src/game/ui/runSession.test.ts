import { beforeEach, describe, expect, it } from 'vitest';
import { STARTING_DEPTH, useGameStore } from '../store';
import { resetRunState } from './runSession';

beforeEach(() => {
  resetRunState();
});

describe('resetRunState', () => {
  it('restores the fresh-run aggregates', () => {
    useGameStore.setState({
      currentDepth: 7,
      goldCollected: 42,
      monstersSlain: 9,
      hasKey: true,
      autoPlaying: false,
      lastInputTime: 1234,
    });

    resetRunState();

    const state = useGameStore.getState();
    expect(state.currentDepth).toBe(STARTING_DEPTH);
    expect(state.goldCollected).toBe(0);
    expect(state.monstersSlain).toBe(0);
    expect(state.hasKey).toBe(false);
    expect(state.autoPlaying).toBe(true);
    expect(state.lastInputTime).toBe(0);
  });

  it('keeps debug preferences out of the reset', () => {
    useGameStore.setState({
      debugPanelOpen: true,
      physicsDebug: true,
      pathDebug: true,
    });

    resetRunState();

    const state = useGameStore.getState();
    expect(state.debugPanelOpen).toBe(true);
    expect(state.physicsDebug).toBe(true);
    expect(state.pathDebug).toBe(true);
  });
});
