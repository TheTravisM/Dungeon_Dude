import { HERO_COMBAT_HOLD_MS } from '../constants';

export interface CombatIntent {
  dirX: number;
  dirZ: number;
  moveUntil: number;
  attackUntil: number;
  engaged: boolean;
}

/** The brain's combat intent. Expires by itself when the brain stops ticking. */
export const heroCombat: CombatIntent = {
  dirX: 0,
  dirZ: 0,
  moveUntil: 0,
  attackUntil: 0,
  engaged: false,
};

export function setCombatMove(
  dirX: number,
  dirZ: number,
  nowMs: number
): void {
  heroCombat.dirX = dirX;
  heroCombat.dirZ = dirZ;
  heroCombat.moveUntil = nowMs + HERO_COMBAT_HOLD_MS;
}

export function setCombatAttack(nowMs: number): void {
  heroCombat.attackUntil = nowMs + HERO_COMBAT_HOLD_MS;
}

/** True while a move intent is live; writes zero into `out` once expired. */
export function combatDirection(
  nowMs: number,
  out: { x: number; z: number }
): boolean {
  if (nowMs >= heroCombat.moveUntil) {
    out.x = 0;
    out.z = 0;
    return false;
  }
  out.x = heroCombat.dirX;
  out.z = heroCombat.dirZ;
  return true;
}

export function wantsAttack(nowMs: number): boolean {
  return nowMs < heroCombat.attackUntil;
}

export function resetCombat(): void {
  heroCombat.dirX = 0;
  heroCombat.dirZ = 0;
  heroCombat.moveUntil = 0;
  heroCombat.attackUntil = 0;
  heroCombat.engaged = false;
}
