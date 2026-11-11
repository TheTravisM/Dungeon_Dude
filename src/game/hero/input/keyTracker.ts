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

/**
 * Tracks held physical key codes. `KeyboardEvent.code` is layout-independent,
 * so WASD keeps working on non-QWERTY keyboards.
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

      return {
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (forward ? 1 : 0) - (backward ? 1 : 0),
      };
    },
    attackHeld() {
      return held.has(ATTACK_CODE);
    },
    anyHeld() {
      return held.size > 0;
    },
  };
}
