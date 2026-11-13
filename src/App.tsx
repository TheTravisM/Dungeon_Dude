import { useState } from 'react';
import { KeyboardControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import DebugOverlay from './components/debug/DebugOverlay';
import DungeonStats from './components/debug/DungeonStats';
import HeroDebugReadout from './components/debug/HeroDebugReadout';
import PathDebug from './components/debug/PathDebug';
import RendererInfoLogger from './components/debug/RendererInfoLogger';
import Dungeon from './components/dungeon/Dungeon';
import Effects from './components/Effects';
import Hero from './components/hero/Hero';
import HeroDeathBridge from './components/hero/HeroDeathBridge';
import HeroVitalsBridge from './components/hero/HeroVitalsBridge';
import InputBridge from './components/hero/InputBridge';
import LevelEntities from './components/level/LevelEntities';
import GamePhysics from './components/physics/GamePhysics';
import CameraFollow from './components/scene/CameraFollow';
import {
  CAMERA_OFFSET,
  CAMERA_ZOOM,
} from './components/scene/cameraConstants';
import IsometricCamera from './components/scene/IsometricCamera';
import Lighting from './components/scene/Lighting';
import QualityTier from './components/scene/QualityTier';
import { CAMERA_FAR, CAMERA_NEAR } from './config/dioramaConfig';
import MainMenu from './components/ui/MainMenu';
import HUD from './components/ui/HUD';
import GameOver from './components/ui/GameOver';
import ScreenAnnouncer from './components/ui/ScreenAnnouncer';
import { getDungeonLayout } from './game/dungeon/getDungeonLayout';
import { useGameStore } from './game/store';
import { useScreenStore } from './game/ui/screenStore';
import { useRunSeedStore } from './game/ui/runSeedStore';
import styles from './App.module.scss';

/**
 * App deliberately stays thin. It owns the stacking order between the WebGL
 * canvas and the DOM overlay, while focused scene components own the meshes
 * and lights. This keeps future UI work from bleeding into render code.
 */

/**
 * Keyboard map for the hero controller. WASD and the arrow keys drive the
 * same four logical directions so both input styles feel identical.
 */
const KEYBOARD_CONTROLS = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'], up: true },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'], up: true },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'], up: true },
  { name: 'right', keys: ['KeyD', 'ArrowRight'], up: true },
];

export default function App() {
  // Depth is a rare UI-level change, so a store subscription is appropriate.
  // Per-frame data stays in the ECS world instead.
  const currentDepth = useGameStore((state) => state.currentDepth);
  const runSeed = useRunSeedStore((state) => state.seed);
  const layout = getDungeonLayout(currentDepth, runSeed);
  const screen = useScreenStore((state) => state.screen);

  // Diagnostics are a deliberate, infrequent UI action. Keeping the switch here
  // lets the DOM overlay and the in-canvas StatsGl share one piece of state.
  const [statsVisible, setStatsVisible] = useState(false);

  return (
    <div className={styles.app}>
      {screen === 'playing' && (
        <div className={styles.canvasLayer}>
          <KeyboardControls map={KEYBOARD_CONTROLS}>
            <Canvas
              dpr={[1, 1.5]}
              gl={{
                antialias: false,
                powerPreference: 'high-performance',
                stencil: false,
                alpha: false,
              }}
              orthographic
              camera={{ position: CAMERA_OFFSET, zoom: CAMERA_ZOOM, near: CAMERA_NEAR, far: CAMERA_FAR }}
            >
              <color attach="background" args={['#0b0e14']} />
              <IsometricCamera />
              <CameraFollow />
              <Lighting />
              <QualityTier />
              <GamePhysics>
                <Dungeon layout={layout} />
                <Hero key={layout.seed} layout={layout} />
                <LevelEntities layout={layout} />
                <InputBridge />
                <HeroVitalsBridge />
                <HeroDeathBridge />
              </GamePhysics>
              <Effects />
              {import.meta.env.DEV && <PathDebug layout={layout} />}
              <DungeonStats visible={statsVisible} />
              {import.meta.env.DEV && <HeroDebugReadout />}
              {import.meta.env.DEV && <RendererInfoLogger />}
            </Canvas>
          </KeyboardControls>
        </div>
      )}

      <div className={styles.uiLayer}>
        <ScreenAnnouncer />
        {screen === 'mainMenu' && <MainMenu />}
        {screen === 'gameOver' && <GameOver />}
        {screen === 'playing' && (
          <>
            <HUD />
            <DebugOverlay
              depth={currentDepth}
              layout={layout}
              statsVisible={statsVisible}
              onToggleStats={() => setStatsVisible((visible) => !visible)}
            />
          </>
        )}
      </div>
    </div>
  );
}
