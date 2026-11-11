import { beforeEach, describe, expect, it } from 'vitest';
import {
  combatDirection,
  heroCombat,
  resetCombat,
  setCombatAttack,
  setCombatMove,
  wantsAttack,
} from './combatIntent';
import { HERO_COMBAT_HOLD_MS } from '../constants';

const out = { x: 0, z: 0 };

describe('combatIntent', () => {
  beforeEach(() => resetCombat());

  it('exposes a live move intent and expires it at the hold time', () => {
    setCombatMove(0.6, -0.8, 1000);
    expect(combatDirection(1000, out)).toBe(true);
    expect(out).toEqual({ x: 0.6, z: -0.8 });

    expect(combatDirection(1000 + HERO_COMBAT_HOLD_MS - 1, out)).toBe(true);
    expect(combatDirection(1000 + HERO_COMBAT_HOLD_MS, out)).toBe(false);
    expect(out).toEqual({ x: 0, z: 0 });
  });

  it('refreshes a move intent in place', () => {
    setCombatMove(1, 0, 0);
    setCombatMove(0, 1, 200);
    expect(combatDirection(250, out)).toBe(true);
    expect(out).toEqual({ x: 0, z: 1 });
  });

  it('expires attack intent at the hold time', () => {
    setCombatAttack(500);
    expect(wantsAttack(500)).toBe(true);
    expect(wantsAttack(500 + HERO_COMBAT_HOLD_MS - 1)).toBe(true);
    expect(wantsAttack(500 + HERO_COMBAT_HOLD_MS)).toBe(false);
  });

  it('reset clears directions, clocks, and engagement', () => {
    setCombatMove(1, 1, 10);
    setCombatAttack(10);
    heroCombat.engaged = true;

    resetCombat();

    expect(heroCombat).toEqual({
      dirX: 0,
      dirZ: 0,
      moveUntil: 0,
      attackUntil: 0,
      engaged: false,
    });
    expect(combatDirection(0, out)).toBe(false);
    expect(wantsAttack(0)).toBe(false);
  });
});
