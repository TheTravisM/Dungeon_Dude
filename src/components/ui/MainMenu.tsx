import { commitScreenEvent } from '../../game/ui/screenTransition';
import styles from './MainMenu.module.scss';

/**
 * Initial screen. The Enter Dungeon button is the only gesture required to
 * start playing; it goes through the screen transition helper so supported
 * browsers animate the swap and reduced-motion users get a direct update.
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
          onClick={() => commitScreenEvent('startGame')}
        >
          Enter Dungeon
        </button>
      </div>
    </section>
  );
}
