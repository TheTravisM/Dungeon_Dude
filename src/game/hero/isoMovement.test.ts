import { describe, expect, it } from 'vitest';
import { axesToWorldDirection } from './isoMovement';

const D = Math.SQRT1_2;

describe('axesToWorldDirection', () => {
  it('maps W to screen-up world space', () => {
    const dir = axesToWorldDirection({ x: 0, y: 1 });
    expect(dir.x).toBeCloseTo(-D);
    expect(dir.z).toBeCloseTo(-D);
  });

  it('maps D to screen-right world space', () => {
    const dir = axesToWorldDirection({ x: 1, y: 0 });
    expect(dir.x).toBeCloseTo(D);
    expect(dir.z).toBeCloseTo(-D);
  });

  it('maps W+D straight along -z', () => {
    const dir = axesToWorldDirection({ x: 1, y: 1 });
    expect(dir.x).toBeCloseTo(0);
    expect(dir.z).toBeCloseTo(-1);
  });

  it('cancels opposing axes to zero', () => {
    expect(axesToWorldDirection({ x: 0, y: 0 })).toEqual({ x: 0, z: 0 });
  });

  it('returns unit length for every nonzero input', () => {
    for (const axes of [
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: -1 },
      { x: 0.25, y: 0.75 },
    ]) {
      const dir = axesToWorldDirection(axes);
      expect(Math.hypot(dir.x, dir.z)).toBeCloseTo(1);
    }
  });
});
