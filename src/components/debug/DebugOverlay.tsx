import type { DungeonLayout } from '../../types';
import { useGameStore } from '../../game/store';
import styles from './DebugOverlay.module.scss';

interface DebugOverlayProps {
  depth: number;
  layout: DungeonLayout;
  statsVisible: boolean;
  onToggleStats: () => void;
}

/**
 * Temporary development controls. This is deliberately separate from the final
 * HUD and disappears entirely from production builds. The physics switch flips
 * the Zustand value that GamePhysics reads, so Rapier wireframes toggle without
 * restarting Vite or reloading a seed.
 */
export default function DebugOverlay({
  depth,
  layout,
  statsVisible,
  onToggleStats,
}: DebugOverlayProps) {
  const debugPanelOpen = useGameStore((state) => state.debugPanelOpen);
  const physicsDebug = useGameStore((state) => state.physicsDebug);
  const pathDebug = useGameStore((state) => state.pathDebug);
  const toggleDebugPanel = useGameStore((state) => state.toggleDebugPanel);
  const togglePhysicsDebug = useGameStore((state) => state.togglePhysicsDebug);
  const togglePathDebug = useGameStore((state) => state.togglePathDebug);

  if (!import.meta.env.DEV) return null;

  if (!debugPanelOpen) {
    return (
      <div className={styles.root}>
        <button type="button" className={styles.openButton} onClick={toggleDebugPanel}>
          Dev
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span>Development</span>
          <button type="button" className={styles.closeButton} onClick={toggleDebugPanel}>
            Close
          </button>
        </div>

        <dl className={styles.facts}>
          <dt>Depth</dt>
          <dd>{depth}</dd>
          <dt>Seed</dt>
          <dd>{layout.seed}</dd>
          <dt>Rooms</dt>
          <dd>{layout.rooms.length}</dd>
          <dt>Floor cells</dt>
          <dd>{layout.floorCells.length}</dd>
          <dt>Wall runs</dt>
          <dd>{layout.wallRuns.length}</dd>
        </dl>

        <label className={styles.toggle}>
          <input type="checkbox" checked={statsVisible} onChange={onToggleStats} />
          <span>Frame stats</span>
        </label>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={physicsDebug}
            onChange={togglePhysicsDebug}
          />
          <span>Physics colliders</span>
        </label>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={pathDebug}
            onChange={togglePathDebug}
          />
          <span>Path overlay</span>
        </label>

        <p className={styles.hint}>
          DEV TOOL: with the path overlay on, click the floor to plan a route
          from the hero.
        </p>

        <p className={styles.hint}>
          Set VITE_DUNGEON_SEED before starting Vite to pin a different layout.
        </p>
      </div>
    </div>
  );
}
