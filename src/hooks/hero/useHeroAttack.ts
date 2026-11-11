import { useFrame } from '@react-three/fiber';
import {
  heroAttack,
  requestAttack,
  updateAttack,
} from '../../game/hero/combat/attackState';
import { wantsAttack } from '../../game/hero/combat/combatIntent';
import { inputState, isManualNow } from '../../game/hero/input/inputState';

/**
 * Advances the swing clock and starts a new swing from rest.
 *
 * Manual mode treats Space (or the gamepad button) as "keep swinging while
 * held"; auto mode swings only while the brain keeps refreshing its combat
 * intent. Both paths go through the same state machine.
 */
export function useHeroAttack(): void {
  useFrame(() => {
    const now = performance.now();
    updateAttack(heroAttack, now);

    const wants =
      isManualNow(now) && inputState.attack
        ? true
        : !isManualNow(now) && wantsAttack(now);

    if (wants) requestAttack(heroAttack, now);
  });
}
