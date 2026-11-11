import type { AttackPhase } from './attackState';

export interface HitTracker {
  /** A monster entered the sword sensor. */
  enter(id: string): void;
  /** A monster left the sensor or was removed. */
  exit(id: string): void;
  /**
   * During the `active` phase, appends each monster inside the sensor that this
   * swing has not hit yet. Every other phase appends nothing. Returns `out`.
   */
  collect(swingId: number, phase: AttackPhase, out: string[]): string[];
  clear(): void;
}

/**
 * Tracks who is inside the sword sensor and who has already been hit by the
 * current swing. Allocation-free in steady state: the caller owns `out`.
 */
export function createHitTracker(): HitTracker {
  const inside = new Set<string>();
  const hitThisSwing = new Set<string>();
  let lastSwingId = -1;

  return {
    enter(id) {
      inside.add(id);
    },
    exit(id) {
      inside.delete(id);
    },
    collect(swingId, phase, out) {
      out.length = 0;
      if (phase !== 'active') return out;
      if (swingId !== lastSwingId) {
        hitThisSwing.clear();
        lastSwingId = swingId;
      }
      for (const id of inside) {
        if (hitThisSwing.has(id)) continue;
        hitThisSwing.add(id);
        out.push(id);
      }
      return out;
    },
    clear() {
      inside.clear();
      hitThisSwing.clear();
      lastSwingId = -1;
    },
  };
}

/** Shared tracker written by the hero sensor events and read each frame. */
export const swordTracker = createHitTracker();
