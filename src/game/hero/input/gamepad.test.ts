import { describe, expect, it } from 'vitest';
import { readGamepad, type PadLike } from './gamepad';

function pad(axes: number[], pressedButtons: number[] = []): PadLike {
  const buttons = Array.from({ length: 16 }, (_, index) => ({
    pressed: pressedButtons.includes(index),
  }));
  return { axes, buttons };
}

describe('readGamepad', () => {
  it('treats input inside the deadzone as inactive', () => {
    const reading = readGamepad(pad([0.1, 0.1]));

    expect(reading.axes).toEqual({ x: 0, y: 0 });
    expect(reading.active).toBe(false);
  });

  it('maps a full push up to y = 1', () => {
    const reading = readGamepad(pad([0, -1]));

    expect(reading.axes.x).toBeCloseTo(0);
    expect(reading.axes.y).toBeCloseTo(1);
    expect(reading.active).toBe(true);
  });

  it('lets the D-pad override the stick', () => {
    const reading = readGamepad(pad([0.8, 0.8], [12, 14]));

    expect(reading.axes).toEqual({ x: -1, y: 1 });
  });

  it('reads attack from buttons 0 and 2', () => {
    expect(readGamepad(pad([0, 0], [0])).attack).toBe(true);
    expect(readGamepad(pad([0, 0], [2])).attack).toBe(true);
  });

  it('returns inactive for a null pad', () => {
    const reading = readGamepad(null);

    expect(reading.axes).toEqual({ x: 0, y: 0 });
    expect(reading.attack).toBe(false);
    expect(reading.active).toBe(false);
  });
});
