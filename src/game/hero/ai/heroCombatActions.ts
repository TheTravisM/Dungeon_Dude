import { State } from 'mistreevous';
import type { Entity } from '../../../types';
import { heroQuery } from '../../ecs';
import { monsterIndex } from '../../monsters/monsterIndex';
import {
  heroCombat,
  setCombatAttack,
  setCombatMove,
} from '../combat/combatIntent';
import {
  HERO_ATTACK_REACH,
  HERO_ENGAGE_RANGE,
  HERO_PATH_CLEARANCE,
} from '../constants';
import type { WorldPoint } from '../navigation/heroPath';
import { clearRoute } from '../navigation/routeState';
import { hasClearLine } from '../navigation/smoothPath';
import type { WalkGrid } from '../navigation/walkGrid';

export interface HeroCombatActions {
  EnemyInReach(): boolean;
  Fight(): State;
}

/** Attack only at nine tenths of reach, so the target cannot drift out mid-swing. */
const ATTACK_STOP = HERO_ATTACK_REACH * 0.9;

/**
 * Combat leaves for the hero tree. Kept out of `heroBrain.ts` so the brain
 * stays under 200 lines. All leaves are instant: they only record intents in
 * `heroCombat`, which the movement and attack hooks consume.
 */
export function createHeroCombatActions(
  grid: WalkGrid,
  getPosition: () => WorldPoint,
  getNowMs: () => number,
  resetStuck: (nowMs: number, pos: WorldPoint) => void
): HeroCombatActions {
  let target: Entity | null = null;

  function EnemyInReach(): boolean {
    const position = getPosition();
    target = monsterIndex.nearest(
      position.x,
      position.z,
      HERO_ENGAGE_RANGE
    );
    const targetPosition = target?.position;
    if (!targetPosition) return false;
    return hasClearLine(grid, position, targetPosition, HERO_PATH_CLEARANCE);
  }

  function Fight(): State {
    const now = getNowMs();
    const position = getPosition();

    if (!heroCombat.engaged) {
      clearRoute();
      resetStuck(now, position);
      heroCombat.engaged = true;
    }

    const targetPosition = target?.position;
    if (!targetPosition) return State.SUCCEEDED;

    const dx = targetPosition.x - position.x;
    const dz = targetPosition.z - position.z;
    const distance = Math.hypot(dx, dz);

    if (distance > ATTACK_STOP) {
      const length = distance > 1e-6 ? distance : 1;
      setCombatMove(dx / length, dz / length, now);
    } else {
      setCombatMove(0, 0, now);
      const hero = heroQuery.first;
      if (hero) hero.heading = Math.atan2(dx, dz);
      setCombatAttack(now);
    }

    return State.SUCCEEDED;
  }

  return { EnemyInReach, Fight };
}
