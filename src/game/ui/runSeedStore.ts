import { create } from 'zustand';

/** A fresh 32-bit seed for each run. Zero is avoided so a seed can be logged. */
function createRunSeed(): number {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const value = cryptoApi.getRandomValues(new Uint32Array(1))[0];
    return value >>> 0 || 1;
  }
  return ((Math.random() * 0xffffffff) >>> 0) || 1;
}

interface RunSeedState {
  /** Seed shared by every floor in the current run. */
  seed: number;
  /** Rolls a new seed for a fresh game without touching screen state. */
  reroll: () => void;
}

/**
 * One random seed per run. The store is separate from `GameState` so the
 * dungeon generator can stay framework-free while the UI still re-renders when
 * a new game starts. The first seed is created when the module loads, which is
 * what makes every page load a different dungeon.
 */
export const useRunSeedStore = create<RunSeedState>()((set) => ({
  seed: createRunSeed(),
  reroll: () => set({ seed: createRunSeed() }),
}));
