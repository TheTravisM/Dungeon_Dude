import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { heroQuery } from '../../game/ecs';
import { commitScreenEvent } from '../../game/ui/screenTransition';

/**
 * Watches the hero entity and reports its first death to the screen store.
 * The report leaves the frame callback through a microtask so the Canvas can
 * unmount after R3F and Rapier finish the current tick.
 */
export default function HeroDeathBridge() {
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;

    const hero = heroQuery.first;
    if (!hero || (hero.health ?? 1) > 0) return;

    reported.current = true;
    queueMicrotask(() => commitScreenEvent('heroDied'));
  });

  return null;
}
