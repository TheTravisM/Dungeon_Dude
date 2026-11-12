import { commitScreenEvent } from '../../game/ui/screenTransition';
import { resetRunState } from '../../game/ui/runSession';
import styles from './MainMenu.module.scss';

/**
 * Initial screen. The Enter Dungeon button is the only gesture required to
 * start playing. It resets the previous run inside the same View Transition as
 * the screen change, then hands off to the transition helper.
 */
export default function MainMenu() {
  return (
    <section className={styles.menu} aria-labelledby="main-menu-title">
      <div className={styles.panel}>
        <h1 id="main-menu-title" className={styles.title}>
          Dungeon Dude
        </h1>
        <button
          type="button"
          className={styles.enter}
          onClick={() =>
            commitScreenEvent('startGame', { before: resetRunState })
          }
        >
          Enter Dungeon
        </button>
      </div>
    </section>
  );
}
