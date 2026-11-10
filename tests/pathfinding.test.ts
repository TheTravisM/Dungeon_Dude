import { describe, expect, it } from 'vitest';
import { buildNavGraph } from '../src/game/pathfinding';
import type { DungeonLayout, GridCell } from '../src/types';

/**
 * `buildNavGraph` only reads `layout.floorCells`, so a partial layout is all
 * the tests need. The cast is safe: the object is a structural subset of the
 * interface and the module under test never touches the other fields.
 */
function makeLayout(cells: GridCell[]): DungeonLayout {
  return { floorCells: cells } as DungeonLayout;
}

describe('Pathfinding Graph', () => {
  it('returns the start-to-target sequence for connected cells', () => {
    // L-shape: (0,0) -> (1,0) -> (1,1). Start and target are diagonal, so the
    // route must turn the corner through (1,0).
    const nav = buildNavGraph(
      makeLayout([
        { x: 0, z: 0 },
        { x: 1, z: 0 },
        { x: 1, z: 1 },
      ])
    );

    const path = nav.findPath(0, 0, 1, 1);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, z: 0 });
    expect(path[path.length - 1]).toEqual({ x: 1, z: 1 });
    // The route is deterministic, so the full sequence is asserted too.
    expect(path).toEqual([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 1, z: 1 },
    ]);
  });

  it('returns an empty array for unreachable targets', () => {
    const nav = buildNavGraph(makeLayout([{ x: 0, z: 0 }]));

    // 99,99 is not a floor cell, so the guard short-circuits before aStar.
    expect(nav.findPath(0, 0, 99, 99)).toEqual([]);
  });

  it('returns the single cell when start equals target', () => {
    const nav = buildNavGraph(makeLayout([{ x: 2, z: 2 }]));

    expect(nav.findPath(2, 2, 2, 2)).toEqual([{ x: 2, z: 2 }]);
  });

  it('routes around a gap instead of cutting through it', () => {
    // (0,0) (1,0)
    // (0,1)  [gap]
    // (1,0) and (0,1) are diagonal, so the route must go through (0,0).
    const nav = buildNavGraph(
      makeLayout([
        { x: 0, z: 0 },
        { x: 1, z: 0 },
        { x: 0, z: 1 },
      ])
    );

    expect(nav.findPath(1, 0, 0, 1)).toEqual([
      { x: 1, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 1 },
    ]);
  });

  it('is deterministic: the same layout yields the same routes', () => {
    const cells: GridCell[] = [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 2, z: 0 },
      { x: 0, z: 1 },
      { x: 1, z: 1 },
      { x: 2, z: 1 },
    ];
    const a = buildNavGraph(makeLayout(cells));
    const b = buildNavGraph(makeLayout(cells));

    expect(a.findPath(0, 0, 2, 1)).toEqual(b.findPath(0, 0, 2, 1));
  });
});