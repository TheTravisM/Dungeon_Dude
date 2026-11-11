import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A controllable stand-in for the module-level input state. The real clock is
 * driven by DOM events, which a node-environment test cannot install, so the
 * manual/auto decision is the only piece we substitute.
 */
const controls = vi.hoisted(() => ({
  manual: false,
  axes: { x: 0, y: 0 },
}));

vi.mock('./input/inputState', () => ({
  isManualNow: () => controls.manual,
  inputState: {
    get axes() {
      return controls.axes;
    },
    attack: false,
    manualActive: controls.manual,
  },
}));

import { resolveHeroDirection } from './intent';
import { axesToWorldDirection } from './isoMovement';
import { clearRoute, routeState, setRoute } from './navigation/routeState';

const ORIGIN = { x: 0, z: 0 };
const GOAL = { x: 0, z: 2 };

describe('resolveHeroDirection', () => {
  beforeEach(() => {
    controls.manual = false;
    controls.axes = { x: 0, y: 0 };
    clearRoute();
    routeState.version = 0;
    // Leaves the module-level manual-transition flag in the auto state.
    resolveHeroDirection(0, ORIGIN);
  });

  it('returns the axes direction while manual', () => {
    controls.manual = true;
    controls.axes = { x: 1, y: 0 };

    expect(resolveHeroDirection(1000, ORIGIN)).toEqual(
      axesToWorldDirection({ x: 1, y: 0 })
    );
  });

  it('follows the route once the manual window has passed', () => {
    setRoute([GOAL], GOAL);

    const dir = resolveHeroDirection(5000, ORIGIN);

    expect(dir.x).toBeCloseTo(0);
    expect(dir.z).toBeCloseTo(1);
  });

  it('consumes reached waypoints in one route write', () => {
    setRoute([{ x: 0, z: 0.05 }, GOAL], GOAL);
    const version = routeState.version;

    const dir = resolveHeroDirection(5000, ORIGIN);

    expect(routeState.points).toEqual([GOAL]);
    expect(routeState.version).toBe(version + 1);
    expect(dir).toEqual({ x: 0, z: 1 });
  });

  it('clears the route on entering manual and does not resume', () => {
    setRoute([GOAL], GOAL);
    controls.manual = true;
    controls.axes = { x: 1, y: 0 };

    resolveHeroDirection(1000, ORIGIN);

    expect(routeState.points).toEqual([]);
    expect(routeState.goal).toBeNull();

    // Further manual frames must not clear again (the version stays put).
    const version = routeState.version;
    resolveHeroDirection(1500, ORIGIN);
    expect(routeState.version).toBe(version);

    // Auto comes back after the window, but there is no route to resume.
    controls.manual = false;
    controls.axes = { x: 0, y: 0 };
    expect(resolveHeroDirection(5000, ORIGIN)).toEqual({ x: 0, z: 0 });
    expect(routeState.points).toEqual([]);
  });
});
