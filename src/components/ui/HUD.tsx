import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useGameStore } from '../../game/store';
import {
  getHeroVitals,
  subscribeHeroVitals,
  type HeroVitals,
} from '../../game/ui/heroVitals';
import styles from './HUD.module.scss';

const HEART_COUNT = 5;

function healthFraction(vitals: HeroVitals): number {
  if (!vitals.hasHero || vitals.maxHealth <= 0) return 0;
  return Math.min(1, Math.max(0, vitals.health / vitals.maxHealth));
}

/**
 * Five hearts with fractional fills. Purely visual; the numeric health value
 * next to them is the accessible source of truth.
 */
function Hearts({ fraction }: { fraction: number }) {
  return (
    <div className={styles.hearts} aria-hidden="true">
      {Array.from({ length: HEART_COUNT }, (_, index) => {
        const fill = Math.min(1, Math.max(0, fraction * HEART_COUNT - index));
        return (
          <span key={index} className={styles.heart}>
            <span
              className={styles.heartFill}
              style={{ width: `${fill * 100}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/**
 * In-game HUD. Gold and depth are rare aggregate values from the Zustand
 * store; health comes from the ECS bridge, which only notifies on changes.
 */
export default function HUD() {
  const vitals = useSyncExternalStore(
    subscribeHeroVitals,
    getHeroVitals,
    getHeroVitals
  );
  const gold = useGameStore((state) => state.goldCollected);
  const depth = useGameStore((state) => state.currentDepth);
  const hudRef = useRef<HTMLElement>(null);

  // The menu button and Game Over actions unmount on transition, so focus would
  // otherwise fall back to the document. The HUD is the logical landing point.
  useEffect(() => {
    hudRef.current?.focus();
  }, []);

  const hasHero = vitals.hasHero && vitals.maxHealth > 0;
  const health = hasHero ? Math.max(0, Math.round(vitals.health)) : 0;
  const maxHealth = hasHero ? Math.round(vitals.maxHealth) : 0;
  const dead = hasHero && health <= 0;
  const healthText = hasHero ? `${health} / ${maxHealth}` : '—';

  return (
    <aside
      ref={hudRef}
      className={styles.hud}
      aria-label="Hero status"
      tabIndex={-1}
    >
      <div
        className={styles.health}
        role="group"
        aria-labelledby="hud-health-label"
      >
        <span id="hud-health-label" className={styles.label}>
          Health
        </span>
        <Hearts fraction={healthFraction(vitals)} />
        <span className={styles.healthValue}>{healthText}</span>
        {dead && <span className={styles.fallen}>Fallen</span>}
      </div>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.label}>Gold</dt>
          <dd className={styles.value}>{gold}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>Depth</dt>
          <dd className={styles.value}>{depth}</dd>
        </div>
      </dl>
    </aside>
  );
}
