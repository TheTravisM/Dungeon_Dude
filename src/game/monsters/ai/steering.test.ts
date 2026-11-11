import { describe, expect, it } from 'vitest';
import { SEPARATION_RADIUS, aggroAllowed, separationVector } from './steering';

describe('aggroAllowed', () => {
  it('rejects a hero beyond the aggro range', () => {
    expect(aggroAllowed(6.1, 6, 6)).toBe(false);
  });

  it('rejects a route that is much longer than the straight line', () => {
    expect(aggroAllowed(2, 12, 6)).toBe(false);
    expect(aggroAllowed(2, 4, 6)).toBe(true);
  });

  it('accepts equal distances and the exact boundary', () => {
    expect(aggroAllowed(4, 4, 4)).toBe(true);
    expect(aggroAllowed(4.0001, 4, 4)).toBe(false);
  });
});

describe('separationVector', () => {
  it('returns zero with no neighbors', () => {
    const out = { x: 9, z: 9 };
    expect(separationVector(0, 0, {}, [], out)).toBe(out);
    expect(out).toEqual({ x: 0, z: 0 });
  });

  it('points away from a single neighbor', () => {
    const out = { x: 0, z: 0 };
    const self = { id: 'self' };
    const other = { position: { x: 0.5, z: 0 } };
    separationVector(0, 0, self, [other], out);
    expect(out.x).toBeLessThan(0);
    expect(Math.abs(out.z)).toBeLessThan(1e-9);
  });

  it('ignores self and neighbors beyond the radius', () => {
    const out = { x: 0, z: 0 };
    const self = { position: { x: 0, z: 0 } };
    const far = { position: { x: SEPARATION_RADIUS + 0.01, z: 0 } };
    separationVector(0, 0, self, [self, far], out);
    expect(out).toEqual({ x: 0, z: 0 });
  });

  it('caps the result at unit length and reuses out', () => {
    const out = { x: 7, z: 7 };
    const neighbors = [
      { position: { x: 0.05, z: 0 } },
      { position: { x: -0.05, z: 0 } },
      { position: { x: 0, z: 0.05 } },
    ];
    const result = separationVector(0, 0, {}, neighbors, out);
    expect(result).toBe(out);
    expect(Math.hypot(out.x, out.z)).toBeLessThanOrEqual(1 + 1e-9);
  });
});
