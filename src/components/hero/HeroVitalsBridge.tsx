import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { heroQuery } from '../../game/ecs';
import {
  clearHeroVitals,
  publishHeroVitals,
} from '../../game/ui/heroVitals';

/**
 * Samples the hero entity every frame but only notifies the HUD store when
 * health changes. Rendered inside the Canvas because it uses `useFrame`; it
 * produces no scene output.
 */
export default function HeroVitalsBridge() {
  useEffect(() => clearHeroVitals, []);

  useFrame(() => {
    const hero = heroQuery.first;
    if (
      !hero ||
      hero.health === undefined ||
      hero.maxHealth === undefined
    ) {
      clearHeroVitals();
      return;
    }
    publishHeroVitals(hero.health, hero.maxHealth);
  });

  return null;
}
