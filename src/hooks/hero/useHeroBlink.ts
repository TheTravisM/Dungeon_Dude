import { useFrame } from '@react-three/fiber';
import { heroQuery } from '../../game/ecs';
import type { HeroRig } from './useHeroRig';

const BLINK_INTERVAL_MS = 80;

/**
 * Blinks the hero visual while it is inside its invulnerability window, then
 * guarantees the visual is visible again. The body itself never changes.
 */
export function useHeroBlink(rig: HeroRig): void {
  useFrame(() => {
    const root = rig.root.current;
    if (!root) return;

    const hurtUntil = heroQuery.first?.hurtUntil ?? 0;
    const now = performance.now();
    if (now < hurtUntil) {
      root.visible = Math.floor(now / BLINK_INTERVAL_MS) % 2 === 0;
    } else if (!root.visible) {
      root.visible = true;
    }
  });
}
