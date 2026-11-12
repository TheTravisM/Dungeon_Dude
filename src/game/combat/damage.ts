import type { Entity } from '../../types';
import { HERO_DEATH_ENABLED } from './constants';

export interface DamageResult {
  applied: boolean;
  dealt: number;
  killed: boolean;
}

/**
 * Applies one damage instance. A target inside its hurt window, a dead target,
 * or a non-positive amount is ignored. When `HERO_DEATH_ENABLED` is false the
 * hero clamps at 1 health instead of dying.
 */
export function applyDamage(
  target: Entity,
  amount: number,
  nowMs: number,
  hurtMs: number
): DamageResult {
  if (
    target.state === 'dead' ||
    nowMs < (target.hurtUntil ?? 0) ||
    amount <= 0
  ) {
    return { applied: false, dealt: 0, killed: false };
  }

  const health = target.health ?? 0;
  const floor = target.isHero && !HERO_DEATH_ENABLED ? 1 : 0;
  const next = Math.max(floor, health - amount);
  target.health = next;
  target.hurtUntil = nowMs + hurtMs;

  const killed = next <= 0;
  if (killed) target.state = 'dead';
  return { applied: true, dealt: health - next, killed };
}
