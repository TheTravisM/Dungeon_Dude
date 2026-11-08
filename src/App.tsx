import { Canvas } from '@react-three/fiber';
import Effects from './components/Effects';
import FloorCollider from './components/physics/FloorCollider';
import GamePhysics from './components/physics/GamePhysics';
import PhysicsProbe from './components/physics/PhysicsProbe';
import Floor from './components/scene/Floor';
import IsometricCamera from './components/scene/IsometricCamera';
import Lighting from './components/scene/Lighting';
import ReferenceBlock from './components/scene/ReferenceBlock';
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
            <Floor />
            <FloorCollider />
            <ReferenceBlock />
            <PhysicsProbe />
          </GamePhysics>
          <Effects />
        </Canvas>
      </div>

      <div className={styles.uiLayer} aria-hidden="true">
        <div className={styles.badge}>
          <span className={styles.badgeTitle}>Dungeon Dude</span>
          <span className={styles.badgeStep}>Step 3 - ECS and Physics</span>
          <span className={styles.badgeMeta}>Depth {currentDepth}</span>
        </div>
      </div>
    </div>
  );
}
