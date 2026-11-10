import { Physics } from '@react-three/rapier';
import type { ReactNode } from 'react';
import { GRAVITY, PHYSICS_TIME_STEP } from '../../game/constants';
import { useGameStore } from '../../game/store';

interface GamePhysicsProps {
  children: ReactNode;
}

/**
 * Owns the single Rapier world. A fixed timestep keeps character movement and
 * collisions deterministic, while interpolation smooths the visuals between
 * physics steps. The store initializes debug rendering from VITE_DEBUG_PHYSICS,
 * then the development overlay can toggle it at runtime without a restart.
 */
export default function GamePhysics({ children }: GamePhysicsProps) {
  const physicsDebug = useGameStore((state) => state.physicsDebug);

  return (
    <Physics
      gravity={GRAVITY}
      timeStep={PHYSICS_TIME_STEP}
      updateLoop="follow"
      interpolate
      debug={physicsDebug}
    >
      {children}
    </Physics>
  );
}
