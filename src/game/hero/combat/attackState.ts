import {
  HERO_ATTACK_ACTIVE_MS,
  HERO_ATTACK_RECOVERY_MS,
  HERO_ATTACK_WINDUP_MS,
} from '../constants';

export type AttackPhase = 'ready' | 'windup' | 'active' | 'recovery';

export interface AttackState {
  phase: AttackPhase;
  /** Absolute milliseconds when the current phase began. */
  phaseStartMs: number;
  /** Identifies one whole swing; 06-07 uses it to prevent double hits. */
  swingId: number;
}

const DURATIONS: Readonly<Record<Exclude<AttackPhase, 'ready'>, number>> =
  Object.freeze({
    windup: HERO_ATTACK_WINDUP_MS,
    active: HERO_ATTACK_ACTIVE_MS,
    recovery: HERO_ATTACK_RECOVERY_MS,
  });

const NEXT: Readonly<
  Record<Exclude<AttackPhase, 'ready'>, AttackPhase>
> = Object.freeze({
  windup: 'active',
  active: 'recovery',
  recovery: 'ready',
});

export function createAttackState(): AttackState {
  return { phase: 'ready', phaseStartMs: 0, swingId: 0 };
}

/** Starts a swing only from rest; a held button cannot cancel or restart one. */
export function requestAttack(state: AttackState, nowMs: number): boolean {
  if (state.phase !== 'ready') return false;
  state.phase = 'windup';
  state.phaseStartMs = nowMs;
  state.swingId += 1;
  return true;
}

/**
 * Advances through any phases a late frame skipped, carrying the leftover time
 * into the next phase so a stall cannot stretch a swing.
 */
export function updateAttack(state: AttackState, nowMs: number): AttackPhase {
  let elapsed = nowMs - state.phaseStartMs;

  while (state.phase !== 'ready') {
    const duration = DURATIONS[state.phase];
    if (elapsed < duration) break;
    elapsed -= duration;
    state.phaseStartMs += duration;
    state.phase = NEXT[state.phase];
  }

  return state.phase;
}

/** Progress within the current phase, clamped to 0..1; 0 while ready. */
export function attackProgress(state: AttackState, nowMs: number): number {
  if (state.phase === 'ready') return 0;
  const duration = DURATIONS[state.phase];
  const elapsed = nowMs - state.phaseStartMs;
  if (elapsed <= 0) return 0;
  if (elapsed >= duration) return 1;
  return elapsed / duration;
}

/** Module singleton, mirroring `inputState` so React never re-renders. */
export const heroAttack: AttackState = createAttackState();
