import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { Color } from 'three';
import type { Entity } from '../../types';
import { MONSTER_HURT_MS, MONSTER_LUNGE_MS } from '../../game/combat/constants';
import { getMonster } from '../../game/monsters/monsterRegistry';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';
import type { MonsterRig } from './Monster';

const WHITE = new Color('#ffffff');
const TELEGRAPH = new Color('#ff2a10');
const TELEGRAPH_MIX = 0.85;
const LUNGE = 0.15;
/** Scratch color reused for every material to avoid per-frame allocation. */
const scratch = new Color();

/**
 * Per-frame monster feedback: hurt flash, wind-up telegraph, and strike lunge.
 * Returns the telegraph progress (0..1) so the actor can add the swell to its
 * own squash animation without two writers fighting over `scale.y`.
 */
export function useMonsterFeedback(
  entity: Entity,
  rigRef: RefObject<MonsterRig | null>
): RefObject<number> {
  const telegraph = useRef(0);

  useFrame((_, delta) => {
    const rig = rigRef.current;
    if (!rig) return;

    const now = performance.now();
    const record = getMonster(entity.id);
    const stats = MONSTER_ARCHETYPES[entity.archetype ?? 'slime'];
    const dead = entity.state === 'dead';

    let windup = 0;
    if (!dead && record?.attack.phase === 'windup') {
      const remaining = Math.max(0, record.attack.endsAtMs - now);
      windup = 1 - remaining / stats.attackWindupMs;
      windup = Math.max(0, Math.min(1, windup));
    }
    telegraph.current = windup;

    const hurtLeft = (entity.hurtUntil ?? 0) - now;
    const flash =
      !dead && hurtLeft > 0 ? Math.min(1, hurtLeft / MONSTER_HURT_MS) : 0;

    for (let index = 0; index < rig.materials.length; index++) {
      const material = rig.materials[index];
      scratch.copy(rig.baseEmissive[index]);
      if (windup > 0) scratch.lerp(TELEGRAPH, windup * TELEGRAPH_MIX);
      if (flash > 0) scratch.lerp(WHITE, flash);

      material.emissive.copy(scratch);
      material.emissiveIntensity = Math.max(
        rig.baseEmissiveIntensity[index],
        windup,
        flash
      );
    }

    let lunge = 0;
    if (!dead && record && record.strikeAtMs > 0) {
      const elapsed = now - record.strikeAtMs;
      if (elapsed >= 0 && elapsed < MONSTER_LUNGE_MS) {
        lunge = LUNGE * (1 - elapsed / MONSTER_LUNGE_MS);
      }
    }
    easing.damp(rig.visual.position, 'z', lunge, 0.04, delta);
  });

  return telegraph;
}
