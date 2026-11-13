import { create } from 'zustand';
import type { QualityTier } from '../../types';

interface QualityState {
  tier: QualityTier;
  /** True once the GPU probe has chosen a starting tier. */
  initialized: boolean;
  /** One-way choice from the GPU probe. Later calls cannot upgrade. */
  initializeTier: (tier: QualityTier) => void;
  /** Performance degradation. Never upgrades, per the blueprint. */
  downgradeToLow: () => void;
}

/**
 * One-way quality state. The GPU probe picks the starting tier, then the
 * PerformanceMonitor can only drop to low. Keeping this in a tiny Zustand
 * store means the effects component re-renders at most twice per session and
 * never during normal play.
 */
export const useQualityStore = create<QualityState>()((set) => ({
  tier: 'high',
  initialized: false,

  initializeTier: (tier) =>
    set((state) => {
      if (state.initialized) return state;
      return { tier, initialized: true };
    }),

  downgradeToLow: () =>
    set((state) => (state.tier === 'low' ? state : { tier: 'low' })),
}));
