import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import DebugOverlay from './components/debug/DebugOverlay';
import DungeonStats from './components/debug/DungeonStats';
import Dungeon from './components/dungeon/Dungeon';
import Effects from './components/Effects';
import Hero from './components/hero/Hero';
import GamePhysics from './components/physics/GamePhysics';
import IsometricCamera from './components/scene/IsometricCamera';
import Lighting from './components/scene/Lighting';
import { getDungeonLayout } from './game/dungeon/getDungeonLayout';
import { useGameStore } from './game/store';
import styles from './App.module.scss';

/**
 * App deliberately stays thin. It owns the stacking order between the WebGL
 * canvas and the DOM overlay, while focused scene components own the meshes
 * and lights. This keeps future UI work from bleeding into render code.
 */
export default function App() {
  // Depth is a rare UI-level change, so a store subscription is appropriate.
  // Per-frame data stays in the ECS world instead.
  const currentDepth = useGameStore((state) => state.currentDepth);
  const layout = getDungeonLayout(currentDepth);

  // Diagnostics are a deliberate, infrequent UI action. Keeping the switch here
  // lets the DOM overlay and the in-canvas StatsGl share one piece of state.
  const [statsVisible, setStatsVisible] = useState(false);

  return (
    <div className={styles.app}>
      <div className={styles.canvasLayer}>
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          orthographic
          camera={{ position: [20, 20, 20], zoom: 40, near: 0.1, far: 200 }}
        >
          <color attach="background" args={['#0b0e14']} />
          <IsometricCamera />
          <Lighting />
          <GamePhysics>
            <Dungeon layout={layout} />
            <Hero position={[layout.spawn.x, layout.spawn.y, layout.spawn.z]} />
          </GamePhysics>
          <Effects />
          <DungeonStats visible={statsVisible} />
        </Canvas>
      </div>

      <div className={styles.uiLayer}>
        <div className={styles.badge}>
          <span className={styles.badgeTitle}>Dungeon Dude</span>
          <span className={styles.badgeStep}>Step 4 - Dungeon Generation</span>
          <span className={styles.badgeMeta}>
            Depth {currentDepth} / Seed {layout.seed}
          </span>
        </div>
        <DebugOverlay
          depth={currentDepth}
          layout={layout}
          statsVisible={statsVisible}
          onToggleStats={() => setStatsVisible((visible) => !visible)}
        />
      </div>
    </div>
  );
}
