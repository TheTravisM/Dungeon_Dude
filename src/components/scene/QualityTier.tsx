import { useEffect } from 'react';
import { PerformanceMonitor, useDetectGPU } from '@react-three/drei';
import { useQualityStore } from '../../game/quality/tierStore';

/**
 * Chooses the starting render tier from the detected GPU, then lets Drei's
 * PerformanceMonitor drop it further when frames start slipping. Both paths
 * write through the one-way tier store, so a slow device never bounces back to
 * an expensive pipeline mid-run.
 */
export default function QualityTier() {
  const { tier } = useDetectGPU();
  const initializeTier = useQualityStore((state) => state.initializeTier);
  const downgradeToLow = useQualityStore((state) => state.downgradeToLow);

  useEffect(() => {
    initializeTier(tier >= 2 ? 'high' : 'low');
  }, [tier, initializeTier]);

  return <PerformanceMonitor onDecline={downgradeToLow} />;
}
