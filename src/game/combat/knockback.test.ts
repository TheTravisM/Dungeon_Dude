import { describe, expect, it } from 'vitest';
import { knockbackDirection, knockbackFactor } from './knockback';

const out = { x: 0, z: 0 };

describe('knockbackDirection', () => {
  it('points away from the source', () => {
    knockbackDirection(0, 0, 3, 4, out);
    expect(out.x).toBeCloseTo(0.6);
    expect(out.z).toBeCloseTo(0.8);
  });

  it('falls back to +Z for zero distance', () => {
    knockbackDirection(2, 2, 2, 2, out);
    expect(out).toEqual({ x: 0, z: 1 });
  });
});

describe('knockbackFactor', () => {
  it('fades linearly from 1 to 0', () => {
    expect(knockbackFactor(1000, 1150, 150)).toBe(1);
    expect(knockbackFactor(1075, 1150, 150)).toBeCloseTo(0.5);
    expect(knockbackFactor(1150, 1150, 150)).toBe(0);
    expect(knockbackFactor(1200, 1150, 150)).toBe(0);
  });

  it('returns 0 for a non-positive duration', () => {
    expect(knockbackFactor(1000, 1100, 0)).toBe(0);
  });
});
