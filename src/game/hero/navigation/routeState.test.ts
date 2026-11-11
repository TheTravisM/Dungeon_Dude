import { beforeEach, describe, expect, it } from 'vitest';
import { clearRoute, routeState, setRoute } from './routeState';

const GOAL = { x: 1.5, z: -2.5 };

describe('routeState', () => {
  beforeEach(() => {
    clearRoute();
    routeState.version = 0;
  });

  it('starts empty', () => {
    expect(routeState.points).toEqual([]);
    expect(routeState.goal).toBeNull();
  });

  it('stores points and goal on set', () => {
    const points = [
      { x: 0.5, z: 0.5 },
      { x: 1.5, z: 0.5 },
    ];

    setRoute(points, GOAL);

    expect(routeState.points).toBe(points);
    expect(routeState.goal).toBe(GOAL);
  });

  it('clears points and goal', () => {
    setRoute([{ x: 0.5, z: 0.5 }], GOAL);

    clearRoute();

    expect(routeState.points).toEqual([]);
    expect(routeState.goal).toBeNull();
  });

  it('increments version on every set or clear', () => {
    const before = routeState.version;

    setRoute([{ x: 0.5, z: 0.5 }], GOAL);
    expect(routeState.version).toBe(before + 1);

    setRoute([], null);
    expect(routeState.version).toBe(before + 2);

    clearRoute();
    expect(routeState.version).toBe(before + 3);
  });
});
