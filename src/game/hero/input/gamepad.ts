import { GAMEPAD_DEADZONE } from '../constants';
import type { Axes } from '../isoMovement';

export interface PadReading {
  axes: Axes;
  attack: boolean;
  active: boolean;
}

/** Minimal structural shape so tests can pass plain objects. */
export interface PadLike {
  axes: readonly number[];
  buttons: readonly { pressed: boolean }[];
}

const DPAD_UP = 12;
const DPAD_DOWN = 13;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;

function pressed(pad: PadLike, index: number): boolean {
  return pad.buttons[index]?.pressed ?? false;
}

/**
 * Reads the first non-null pad into screen axes. Stick Y is inverted so up is
 * positive, the deadzone is applied radially, and the D-pad overrides the
 * stick whenever any direction is held.
 */
export function readGamepad(pad: PadLike | null): PadReading {
  if (!pad) return { axes: { x: 0, y: 0 }, attack: false, active: false };

  let x = pad.axes[0] ?? 0;
  let y = -(pad.axes[1] ?? 0);

  const magnitude = Math.hypot(x, y);
  if (magnitude < GAMEPAD_DEADZONE) {
    x = 0;
    y = 0;
  } else {
    const scaled = Math.min(
      1,
      (magnitude - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE)
    );
    x = (x / magnitude) * scaled;
    y = (y / magnitude) * scaled;
  }

  const up = pressed(pad, DPAD_UP);
  const down = pressed(pad, DPAD_DOWN);
  const left = pressed(pad, DPAD_LEFT);
  const right = pressed(pad, DPAD_RIGHT);

  if (up || down || left || right) {
    x = (right ? 1 : 0) - (left ? 1 : 0);
    y = (up ? 1 : 0) - (down ? 1 : 0);
  }

  const attack = pressed(pad, 0) || pressed(pad, 2);
  const active = x !== 0 || y !== 0 || attack;

  return { axes: { x, y }, attack, active };
}
