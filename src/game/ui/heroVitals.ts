/**
 * Tiny external store for the hero's health. The ECS entity stays the source
 * of truth; this module only caches the last published values so React can
 * subscribe with `useSyncExternalStore` without polling every frame.
 */

export interface HeroVitals {
  hasHero: boolean;
  health: number;
  maxHealth: number;
}

const EMPTY: HeroVitals = { hasHero: false, health: 0, maxHealth: 0 };

let snapshot: HeroVitals = EMPTY;
const listeners = new Set<() => void>();

/** Stable snapshot reference; required by `useSyncExternalStore`. */
export function getHeroVitals(): HeroVitals {
  return snapshot;
}

export function subscribeHeroVitals(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Publishes the current hero values. Identical values are ignored, so the
 * per-frame bridge never re-renders the HUD while health is unchanged.
 */
export function publishHeroVitals(health: number, maxHealth: number): void {
  if (
    snapshot.hasHero &&
    snapshot.health === health &&
    snapshot.maxHealth === maxHealth
  ) {
    return;
  }
  snapshot = { hasHero: true, health, maxHealth };
  listeners.forEach((listener) => listener());
}

/** Marks the hero as absent (before spawn or after the run ends). */
export function clearHeroVitals(): void {
  if (!snapshot.hasHero) return;
  snapshot = EMPTY;
  listeners.forEach((listener) => listener());
}
