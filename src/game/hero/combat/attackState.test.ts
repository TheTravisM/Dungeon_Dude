import { describe, expect, it } from 'vitest';
import {
  createAttackState,
  attackProgress,
  requestAttack,
  updateAttack,
  type AttackState,
} from './attackState';
import {
  HERO_ATTACK_ACTIVE_MS,
  HERO_ATTACK_RECOVERY_MS,
  HERO_ATTACK_WINDUP_MS,
} from '../constants';

const SWING_MS =
  HERO_ATTACK_WINDUP_MS + HERO_ATTACK_ACTIVE_MS + HERO_ATTACK_RECOVERY_MS;

function start(now = 1000): AttackState {
  const state = createAttackState();
  requestAttack(state, now);
  return state;
}

describe('attackState', () => {
  it('starts ready and accepts exactly one request per swing', () => {
    const state = createAttackState();
    expect(state.phase).toBe('ready');

    expect(requestAttack(state, 100)).toBe(true);
    expect(state.swingId).toBe(1);
    expect(requestAttack(state, 110)).toBe(false);
    expect(state.swingId).toBe(1);

    updateAttack(state, 100 + SWING_MS);
    expect(state.phase).toBe('ready');
    expect(requestAttack(state, 100 + SWING_MS + 10)).toBe(true);
    expect(state.swingId).toBe(2);
  });

  it('advances at exactly the phase boundaries', () => {
    const state = start(0);

    updateAttack(state, HERO_ATTACK_WINDUP_MS - 1);
    expect(state.phase).toBe('windup');

    updateAttack(state, HERO_ATTACK_WINDUP_MS);
    expect(state.phase).toBe('active');

    updateAttack(state, HERO_ATTACK_WINDUP_MS + HERO_ATTACK_ACTIVE_MS);
    expect(state.phase).toBe('recovery');

    updateAttack(state, SWING_MS - 1);
    expect(state.phase).toBe('recovery');

    updateAttack(state, SWING_MS);
    expect(state.phase).toBe('ready');
  });

  it('lands on ready after a large time jump and keeps swingId', () => {
    const state = start(0);
    updateAttack(state, 1000);
    expect(state.phase).toBe('ready');
    expect(state.swingId).toBe(1);
  });

  it('reports progress only within a phase', () => {
    const state = start(0);
    expect(attackProgress(state, 0)).toBe(0);

    updateAttack(state, HERO_ATTACK_WINDUP_MS / 2);
    expect(attackProgress(state, HERO_ATTACK_WINDUP_MS / 2)).toBeCloseTo(0.5);

    updateAttack(state, HERO_ATTACK_WINDUP_MS);
    expect(attackProgress(state, HERO_ATTACK_WINDUP_MS)).toBe(0);

    const activeMid = HERO_ATTACK_WINDUP_MS + HERO_ATTACK_ACTIVE_MS / 2;
    updateAttack(state, activeMid);
    expect(attackProgress(state, activeMid)).toBeCloseTo(0.5);

    updateAttack(state, SWING_MS);
    expect(attackProgress(state, SWING_MS)).toBe(0);
  });
});
