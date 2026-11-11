import { describe, expect, it } from 'vitest';
import { directionToWaypoint } from './route';

const REACH = 0.12;

describe('directionToWaypoint', () => {
  it('returns arrived for an empty list', () => {
    expect(directionToWaypoint({ x: 0, z: 0 }, [], REACH)).toEqual({
      dir: { x: 0, z: 0 },
      arrived: true,
    });
  });

  it('returns arrived when every waypoint is within reach', () => {
    const result = directionToWaypoint(
      { x: 0, z: 0 },
      [
        { x: 0.05, z: 0 },
        { x: 0, z: 0.1 },
      ],
      REACH
    );

    expect(result.arrived).toBe(true);
    expect(result.dir).toEqual({ x: 0, z: 0 });
  });

  it('skips a leading waypoint already within reach', () => {
    const result = directionToWaypoint(
      { x: 0, z: 0 },
      [
        { x: 0, z: 0.1 },
        { x: 0, z: 2 },
      ],
      REACH
    );

    expect(result.arrived).toBe(false);
    expect(result.dir.x).toBeCloseTo(0);
    expect(result.dir.z).toBeCloseTo(1);
  });

  it('returns a unit direction toward the first remaining waypoint', () => {
    const result = directionToWaypoint({ x: 0, z: 0 }, [{ x: 3, z: 4 }], REACH);

    expect(result.arrived).toBe(false);
    expect(Math.hypot(result.dir.x, result.dir.z)).toBeCloseTo(1);
    expect(result.dir.x).toBeCloseTo(0.6);
    expect(result.dir.z).toBeCloseTo(0.8);
  });

  it('never returns NaN for a zero-length vector', () => {
    const result = directionToWaypoint({ x: 2, z: -3 }, [{ x: 2, z: -3 }], 0);

    expect(result.arrived).toBe(true);
    expect(Number.isNaN(result.dir.x)).toBe(false);
    expect(Number.isNaN(result.dir.z)).toBe(false);
    expect(result.dir).toEqual({ x: 0, z: 0 });
  });
});
