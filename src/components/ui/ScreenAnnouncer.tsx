import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/store';
import {
  screenAnnouncement,
  type RunSummary,
} from '../../game/ui/screenAnnouncement';
import { useScreenStore } from '../../game/ui/screenStore';
import type { ScreenState } from '../../game/ui/screenState';
import styles from './ScreenAnnouncer.module.scss';

/**
 * Visually hidden polite status region. It stays mounted across screens, so
 * each transition is announced once without competing with the focused screen.
 */
export default function ScreenAnnouncer() {
  const screen = useScreenStore((state) => state.screen);
  const depth = useGameStore((state) => state.currentDepth);
  const gold = useGameStore((state) => state.goldCollected);
  const monstersSlain = useGameStore((state) => state.monstersSlain);

  const previous = useRef<ScreenState | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run: RunSummary = { depth, gold, monstersSlain };
    const text = screenAnnouncement(previous.current, screen, run);
    previous.current = screen;
    if (text) setMessage(text);
  }, [screen, depth, gold, monstersSlain]);

  return (
    <p
      className={styles.announcer}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </p>
  );
}
