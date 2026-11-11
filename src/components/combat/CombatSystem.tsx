import { useFrame } from '@react-three/fiber';
import { heroQuery } from '../../game/ecs';
import {
  HERO_IFRAME_MS,
  KNOCKBACK_MS,
  STRIKE_GRACE,
} from '../../game/combat/constants';
import { applyDamage } from '../../game/combat/damage';
import { spawnDamageNumber } from '../../game/combat/damageNumbers';
import { pushDeath } from '../../game/combat/deathEvents';
import { knockbackDirection } from '../../game/combat/knockback';
import { tickMonsterAttack } from '../../game/combat/monsterAttack';
import { resolveHits } from '../../game/combat/resolveHits';
import { MONSTER_ARCHETYPES } from '../../game/monsters/archetypes';
import {
  forEachMonster,
  getMonster,
} from '../../game/monsters/monsterRegistry';

const knockDirection = { x: 0, z: 0 };

/**
 * Resolves every sword hit queued by the hero sensor, then advances every
 * living monster's strike. All feedback is emitted through pure modules; this
 * component owns no per-frame React state.
 */
export default function CombatSystem() {
  useFrame(() => {
    const now = performance.now();
    const hero = heroQuery.first;
    const heroPosition = hero?.position;
    if (!hero || !heroPosition) return;

    resolveHits(
      (id) => getMonster(id)?.entity,
      hero,
      now,
      (monster, dealt, killed) => {
        const record = getMonster(monster.id);
        const monsterPosition = monster.position;

        if (record && monsterPosition) {
          knockbackDirection(
            heroPosition.x,
            heroPosition.z,
            monsterPosition.x,
            monsterPosition.z,
            knockDirection
          );
          record.knockX = knockDirection.x;
          record.knockZ = knockDirection.z;
          record.knockUntil = now + KNOCKBACK_MS;
        }

        if (monsterPosition) {
          const stats = MONSTER_ARCHETYPES[monster.archetype ?? 'slime'];
          spawnDamageNumber(
            monsterPosition.x,
            monsterPosition.y + stats.height + 0.35,
            monsterPosition.z,
            dealt,
            'dealt',
            now
          );
        }

        if (killed) pushDeath(monster.id, now);
      }
    );

    forEachMonster((record) => {
      const entity = record.entity;
      if (entity.state === 'dead') return;

      const stats = MONSTER_ARCHETYPES[entity.archetype ?? 'slime'];
      if (tickMonsterAttack(record.attack, entity, stats, now) !== 'strike') {
        return;
      }
      record.strikeAtMs = now;

      const monsterPosition = entity.position;
      if (hero.state === 'dead' || !monsterPosition) return;

      const distance = Math.hypot(
        monsterPosition.x - heroPosition.x,
        monsterPosition.z - heroPosition.z
      );
      if (distance > stats.attackRange + STRIKE_GRACE) return;

      const result = applyDamage(
        hero,
        entity.attackPower ?? stats.attackPower,
        now,
        HERO_IFRAME_MS
      );
      if (!result.applied) return;

      spawnDamageNumber(
        heroPosition.x,
        heroPosition.y + 1.1,
        heroPosition.z,
        result.dealt,
        'taken',
        now
      );
    });
  });

  return null;
}
