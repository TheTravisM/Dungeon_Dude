import { create } from 'zustand';
import type { GameState } from '../types';

const configuredLevel = Number(import.meta.env.VITE_STARTING_LEVEL);
const startingLevel =
  Number.isFinite(configuredLevel) && configuredLevel > 0 ? configuredLevel : 1;

/** The environment provides the initial state; the runtime toggle overrides it later. */
const initialPhysicsDebug = import.meta.env.VITE_DEBUG_PHYSICS === 'true';
const initialPathDebug = import.meta.env.VITE_DEBUG_PATH === 'true';

/**
 * UI and aggregate game state only. Positions, rotations, velocities, and
 * combat hit points stay in the ECS world and refs so they never trigger a
 * React render. This store is safe to subscribe to from the HUD.
 *
 * `autoPlaying` is the coarse manual/auto toggle. The idle clock itself lives
 * in the framework-free input module; only a mode flip writes here, so input
 * sampling never causes a render.
 */
export const useGameStore = create<GameState>()((set) => ({
  autoPlaying: true,
  lastInputTime: 0,
  currentDepth: startingLevel,
  goldCollected: 0,
  monstersSlain: 0,
  hasKey: false,
  debugPanelOpen: false,
  physicsDebug: initialPhysicsDebug,
  pathDebug: initialPathDebug,

  setAutoPlaying: (isAuto) => set({ autoPlaying: isAuto }),

  updateLastInputTime: () => set({ lastInputTime: performance.now() }),

  incrementGold: (amount) => set((state) => ({ goldCollected: state.goldCollected + amount })),

  incrementMonstersSlain: () =>
    set((state) => ({ monstersSlain: state.monstersSlain + 1 })),

  setHasKey: (hasKey) => set({ hasKey }),

  // The key is consumed by the descent: the rebuilt tree starts keyless, and
  // the store must agree so the HUD never shows a spent key.
  descendToNextLevel: () =>
    set((state) => ({
      currentDepth: state.currentDepth + 1,
      autoPlaying: true,
      hasKey: false,
    })),

  toggleDebugPanel: () => set((state) => ({ debugPanelOpen: !state.debugPanelOpen })),

  togglePhysicsDebug: () => set((state) => ({ physicsDebug: !state.physicsDebug })),

  togglePathDebug: () => set((state) => ({ pathDebug: !state.pathDebug })),
}));
