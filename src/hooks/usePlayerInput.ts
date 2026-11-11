import { useCallback, useRef } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../game/store';

/**
 * Unified player input: keyboard (via Drei's useKeyboardControls) plus the
 * first connected gamepad. The result is a normalized direction on the XZ
 * plane so the hero controller can treat both sources identically.
 *
 * The hook must be called at the top level of a component rendered inside the
 * <KeyboardControls> provider; it is not safe to call inside useFrame. The
 * returned fields are fresh as of the last render; call sample() once per
 * frame (e.g. in useFrame) so gamepad sticks are read continuously.
 *
 * sample() also owns the manual/auto idle timer: any input keeps the game in
 * manual mode, and after IDLE_TIMEOUT_MS without input it flips back to auto
 * mode. The timestamp lives at module level on purpose, so per-frame sampling
 * never writes to the Zustand store; only the mode flip does.
 */

/** Minimum stick deflection before a gamepad axis counts as input. */
const GAMEPAD_DEADZONE = 0.2;

/** Milliseconds without input before the game switches into auto mode. */
const IDLE_TIMEOUT_MS = 4000;

/**
 * Module level on purpose: it must survive re-renders and stay out of the
 * Zustand store, which would otherwise be written on every input frame.
 */
let lastInputTime = performance.now();

function applyDeadzone(value: number): number {
  return Math.abs(value) < GAMEPAD_DEADZONE ? 0 : value;
}

interface PlayerInputState {
  /** Normalized movement direction on the XZ plane (y is always 0). */
  direction: THREE.Vector3;
  /** True while any key or stick is pushing the hero. */
  isMoving: boolean;
  /** True while the player is actively driving (any key/stick active). */
  isManual: boolean;
}

export interface PlayerInput extends PlayerInputState {
  /** True while the hero is driven by auto mode instead of the player. */
  isAutoMode: boolean;
  /**
   * Re-reads keyboard and gamepad, updating the shared state in place.
   * Returns the same state object, so callers can keep reading the fields.
   */
  sample(): PlayerInputState;
}

export function usePlayerInput(): PlayerInput {
  // Index 1 is the non-reactive getter; per-frame reads must not re-render.
  const [, get] = useKeyboardControls();
  // The mode flips rarely, so a subscription is cheap and keeps the returned
  // isAutoMode fresh for the hero controller.
  const isAutoMode = useGameStore((state) => state.isAutoMode);

  const stateRef = useRef<PlayerInputState | null>(null);
  if (stateRef.current === null) {
    stateRef.current = {
      direction: new THREE.Vector3(),
      isMoving: false,
      isManual: false,
    };
  }
  const state = stateRef.current;

  const sample = useCallback((): PlayerInputState => {
    const keys = get();

    let x = 0;
    let z = 0;
    if (keys.forward) z -= 1;
    if (keys.backward) z += 1;
    if (keys.left) x -= 1;
    if (keys.right) x += 1;

    // First non-null gamepad: axes[0] = left stick X, axes[1] = left stick Y.
    let padX = 0;
    let padY = 0;
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      for (const pad of navigator.getGamepads()) {
        if (!pad) continue;
        padX = applyDeadzone(pad.axes[0] ?? 0);
        padY = applyDeadzone(pad.axes[1] ?? 0);
        break;
      }
    }

    // Stick "up" (negative Y) maps to world -Z (forward).
    let dirX = x + padX;
    let dirZ = z - padY;
    const length = Math.hypot(dirX, dirZ);
    if (length > 1) {
      dirX /= length;
      dirZ /= length;
    }

    state.direction.set(dirX, 0, dirZ);
    state.isMoving = length > 0;
    state.isManual = length > 0;

    // Idle timer: manual input refreshes the stamp and forces manual mode;
    // past the timeout with no input the game flips back to auto. Zustand is
    // only written when the mode actually flips.
    const { isAutoMode: autoMode, setAutoMode } = useGameStore.getState();
    if (state.isManual) {
      lastInputTime = performance.now();
      if (autoMode) setAutoMode(false);
    } else if (!autoMode && performance.now() - lastInputTime > IDLE_TIMEOUT_MS) {
      setAutoMode(true);
    }

    return state;
  }, [get]);

  return {
    direction: state.direction,
    isMoving: state.isMoving,
    isManual: state.isManual,
    isAutoMode,
    sample,
  };
}
