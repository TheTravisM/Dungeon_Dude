import { create } from 'zustand';
import type { GameState } from '../types';

const configuredLevel = Number(import.meta.env.VITE_STARTING_LEVEL);
const startingLevel =
  Number.isFinite(configuredLevel) && configuredLevel > 0 ? configuredLevel : 1;

/** The environment provides the initial state; the runtime toggle overrides it later. */
const initialPhysicsDebug = import.meta.env.VITE_DEBUG_PHYSICS === 'true';

/**
 * UI and aggregate game state only. Positions, rotations, velocities, and
 * combat hit points stay in the ECS world and refs so they never trigger a
 * React render. This store is safe to subscribe to from the HUD.
 *
 * `isAutoMode` is the coarse manual/auto toggle. The idle timestamp that
 * drives it lives at module level in `usePlayerInput` so per-frame input
 * sampling never writes to this store; only the mode flip does.
 */
export const useGameStore = create<GameState>()((set) => ({
  isAutoMode: false,
  currentDepth: startingLevel,
  goldCollected: 0,
  monstersSlain: 0,
  debugPanelOpen: false,
  physicsDebug: initialPhysicsDebug,

  setAutoMode: (isAuto) => set({ isAutoMode: isAuto }),

  incrementGold: (amount) => set((state) => ({ goldCollected: state.goldCollected + amount })),

  incrementMonstersSlain: () =>
    set((state) => ({ monstersSlain: state.monstersSlain + 1 })),

  descendToNextLevel: () =>
    set((state) => ({
      currentDepth: state.currentDepth + 1,
      isAutoMode: true,
    })),

  toggleDebugPanel: () => set((state) => ({ debugPanelOpen: !state.debugPanelOpen })),

  togglePhysicsDebug: () => set((state) => ({ physicsDebug: !state.physicsDebug })),
}));
