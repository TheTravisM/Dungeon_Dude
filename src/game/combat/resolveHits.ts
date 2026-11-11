import type { Entity } from '../../types';
import { MONSTER_HURT_MS } from './constants';
import { applyDamage } from './damage';
import { drainHits } from './hitEvents';

/**
 * Turns queued sword hits into damage. The caller supplies the monster lookup,
 * the attacking hero, and a callback for feedback (knockback, numbers, deaths).
 * Returns how many hits actually applied.
 */
export function resolveHits(
  findMonster: (id: string) => Entity | undefined,
  hero: Entity,
  nowMs: number,
  onApplied: (monster: Entity, dealt: number, killed: boolean) => void
): number {
  const attackPower = hero.attackPower ?? 10;
  let applied = 0;

  drainHits((event) => {
    const monster = findMonster(event.targetId);
    if (!monster) return;
    const result = applyDamage(monster, attackPower, nowMs, MONSTER_HURT_MS);
    if (!result.applied) return;
    applied += 1;
    onApplied(monster, result.dealt, result.killed);
  });

  return applied;
}
