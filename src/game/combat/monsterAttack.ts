import type { Entity } from '../../types';
import type { MonsterArchetype } from '../monsters/archetypes';

export interface MonsterAttackState {
  phase: 'idle' | 'windup';
  endsAtMs: number;
}

export type AttackTick = 'none' | 'started' | 'cancelled' | 'strike';

/** Cancel cooldown so an interrupted swing does not restart immediately. */
const CANCEL_RECOVERY_MS = 300;

export function createMonsterAttack(): MonsterAttackState {
  return { phase: 'idle', endsAtMs: 0 };
}

/**
 * Advances one monster's strike. The brain only sets `entity.state`; this state
 * machine owns the wind-up, interruption, cooldown, and strike timing.
 */
export function tickMonsterAttack(
  state: MonsterAttackState,
  entity: Entity,
  archetype: MonsterArchetype,
  nowMs: number
): AttackTick {
  if (entity.state === 'dead') {
    if (state.phase === 'windup') {
      state.phase = 'idle';
      entity.attackReadyAt = nowMs + CANCEL_RECOVERY_MS;
      return 'cancelled';
    }
    return 'none';
  }

  if (state.phase === 'windup') {
    if (entity.state !== 'attack' || nowMs < (entity.hurtUntil ?? 0)) {
      state.phase = 'idle';
      entity.attackReadyAt = nowMs + CANCEL_RECOVERY_MS;
      return 'cancelled';
    }
    if (nowMs >= state.endsAtMs) {
      state.phase = 'idle';
      entity.attackReadyAt = nowMs + archetype.attackCooldownMs;
      return 'strike';
    }
    return 'none';
  }

  if (entity.state === 'attack' && nowMs >= (entity.attackReadyAt ?? 0)) {
    state.phase = 'windup';
    state.endsAtMs = nowMs + archetype.attackWindupMs;
    return 'started';
  }

  return 'none';
}
