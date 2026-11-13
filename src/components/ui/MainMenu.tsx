import { useEffect, useId, useRef } from 'react';
import { commitScreenEvent } from '../../game/ui/screenTransition';
import { resetRunState } from '../../game/ui/runSession';
import styles from './MainMenu.module.scss';

/**
 * Initial screen. The Enter Dungeon button is the only gesture required to
 * start playing. It resets the previous run inside the same View Transition as
 * the screen change, then hands off to the transition helper.
 */
export default function MainMenu() {
  const enterRef = useRef<HTMLButtonElement>(null);
  const controlsId = useId();
  const controlsTitleId = `${controlsId}-title`;

  // Returning from Game Over unmounts the previous screen's actions, so the
  // menu takes focus explicitly instead of dropping it on the document.
  useEffect(() => {
    enterRef.current?.focus();
  }, []);

  return (
    <section className={styles.menu} aria-labelledby="main-menu-title">
      <div className={styles.panel}>
        <h1 id="main-menu-title" className={styles.title}>
          Dungeon Dude
        </h1>

        <div className={styles.actions}>
          <button
            ref={enterRef}
            type="button"
            className={`${styles.button} ${styles.enter}`}
            onClick={() =>
              commitScreenEvent('startGame', { before: resetRunState })
            }
          >
            Enter Dungeon
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.controls}`}
            popoverTarget={controlsId}
          >
            Controls
          </button>
        </div>
      </div>

      {/* Native popover: Escape and light-dismiss come from the browser, and
          focus returns to the Controls button automatically. */}
      <div
        id={controlsId}
        popover="auto"
        className={styles.popover}
        aria-labelledby={controlsTitleId}
      >
        <h2 id={controlsTitleId} className={styles.popoverTitle}>
          Controls
        </h2>
        <dl className={styles.controlList}>
          <div className={styles.controlRow}>
            <dt className={styles.controlLabel}>Move</dt>
            <dd className={styles.controlValue}>WASD or arrow keys</dd>
          </div>
          <div className={styles.controlRow}>
            <dt className={styles.controlLabel}>Gamepad</dt>
            <dd className={styles.controlValue}>Left stick</dd>
          </div>
          <div className={styles.controlRow}>
            <dt className={styles.controlLabel}>Autopilot</dt>
            <dd className={styles.controlValue}>
              Resumes after four idle seconds
            </dd>
          </div>
        </dl>
        <p className={styles.popoverHint}>Press Escape or tap outside to close.</p>
      </div>
    </section>
  );
}
