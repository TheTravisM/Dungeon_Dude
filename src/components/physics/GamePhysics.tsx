import { Physics } from '@react-three/rapier';
import type { ReactNode } from 'react';
import { GRAVITY, PHYSICS_TIME_STEP } from '../../game/constants';

interface GamePhysicsProps {
  children: ReactNode;
}

/** Read once at module load; Vite replaces the env expression at build time. */
const PHYSICS_DEBUG = import.meta.env.VITE_DEBUG_PHYSICS === 'true';

/**
 * Owns the single Rapier world. A fixed timestep keeps character movement and
 * collisions deterministic, while interpolation smooths the visuals between
 * physics steps. Debug rendering is opt-in through VITE_DEBUG_PHYSICS.
 */
export default function GamePhysics({ children }: GamePhysicsProps) {
  return (
    <Physics
      gravity={GRAVITY}
      timeStep={PHYSICS_TIME_STEP}
      updateLoop="follow"
      interpolate
      debug={PHYSICS_DEBUG}
    >
      {children}
    </Physics>
  );
}
