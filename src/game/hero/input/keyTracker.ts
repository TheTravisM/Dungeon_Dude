import type { Axes } from '../isoMovement';

export interface KeyTracker {
  keyDown(code: string): void;
  keyUp(code: string): void;
  clear(): void;
  axes(): Axes;
  attackHeld(): boolean;
  anyHeld(): boolean;
}

const MOVE_CODES = new Set([
  'KeyW',
  'ArrowUp',
  'KeyS',
  'ArrowDown',
  'KeyA',
  'ArrowLeft',
  'KeyD',
  'ArrowRight',
]);

const ATTACK_CODE = 'Space';

const MAPPED_CODES = new Set([...MOVE_CODES, ATTACK_CODE]);

const DIAGONAL = Math.SQRT1_2;

/**
 * Tracks held physical key codes. `KeyboardEvent.code` is layout-independent,
 * so WASD keeps working on non-QWERTY keyboards.
 *
 * Each movement key maps to a screen-space diagonal so the hero travels along
 * the isometric grid: W is up-left, D is up-right, S is down-right, and A is
 * down-left. Holding two keys cancels the diagonal and moves straight.
 */
export function createKeyTracker(): KeyTracker {
  const held = new Set<string>();

  return {
    keyDown(code) {
      if (MAPPED_CODES.has(code)) held.add(code);
    },
    keyUp(code) {
      held.delete(code);
    },
    clear() {
      held.clear();
    },
    axes() {
      const forward = held.has('KeyW') || held.has('ArrowUp');
      const backward = held.has('KeyS') || held.has('ArrowDown');
      const left = held.has('KeyA') || held.has('ArrowLeft');
      const right = held.has('KeyD') || held.has('ArrowRight');

      const x =
        Number(right) + Number(backward) - Number(left) - Number(forward);
      const y =
        Number(forward) + Number(right) - Number(backward) - Number(left);

      return { x: x * DIAGONAL, y: y * DIAGONAL };
    },
    attackHeld() {
      return held.has(ATTACK_CODE);
    },
    anyHeld() {
      return held.size > 0;
    },
  };
}
