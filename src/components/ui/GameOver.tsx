import { useEffect, useRef } from 'react';
import { useGameStore } from '../../game/store';
import { resetRunState } from '../../game/ui/runSession';
import { commitScreenEvent } from '../../game/ui/screenTransition';
import styles from './GameOver.module.scss';

/**
 * Death summary and the two approved exits. Restart resets run aggregates and
 * returns to Playing inside one View Transition; Main Menu leaves the run data
 * untouched because starting a new game resets it at the menu boundary.
 */
export default function GameOver() {
  const depth = useGameStore((state) => state.currentDepth);
  const gold = useGameStore((state) => state.goldCollected);
  const slain = useGameStore((state) => state.monstersSlain);
  const restartRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    restartRef.current?.focus();
  }, []);

  return (
    <section
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      aria-describedby="game-over-subtitle"
    >
      <div className={styles.panel}>
        <h1 id="game-over-title" className={styles.title}>
          Game Over
        </h1>
        <p id="game-over-subtitle" className={styles.subtitle}>
          The dungeon claims another adventurer.
        </p>

        <dl className={styles.summary}>
          <div className={styles.stat}>
            <dt className={styles.label}>Depth</dt>
            <dd className={styles.value}>{depth}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.label}>Gold</dt>
            <dd className={styles.value}>{gold}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.label}>Monsters Slain</dt>
            <dd className={styles.value}>{slain}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button
            type="button"
            ref={restartRef}
            className={`${styles.button} ${styles.primary}`}
            onClick={() =>
              commitScreenEvent('restart', { before: resetRunState })
            }
          >
            Restart
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => commitScreenEvent('returnToMenu')}
          >
            Main Menu
          </button>
        </div>
      </div>
    </section>
  );
}
