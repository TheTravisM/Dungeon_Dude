import { describe, expect, it } from 'vitest';
import { buildNavGraph, validateNode } from '../src/game/pathfinding';
import type { DungeonLayout, GridCell } from '../src/types';

/**
 * The pathfinding module only reads `layout.floorCells`, so a structural
 * subset is enough for these tests. The cast mirrors the existing pathfinding
 * and hero-tree tests.
 */
function makeLayout(cells: GridCell[]): DungeonLayout {
  return { floorCells: cells } as DungeonLayout;
}

describe('Step 5 Integration & Seed Resilience', () => {
  it('should build a complete navigation matrix and handle valid paths', () => {
    const layout = makeLayout([
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 2, z: 0 },
      { x: 2, z: 1 },
    ]);

    const nav = buildNavGraph(layout);
    const path = nav.findPath(0, 0, 2, 1);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, z: 0 });
    expect(path[path.length - 1]).toEqual({ x: 2, z: 1 });
  });

  it('should validate node existence correctly across layout changes', () => {
    const layout = makeLayout([{ x: 5, z: 5 }]);

    const nav = buildNavGraph(layout);

    expect(validateNode(nav.graph, 5, 5)).toBe(true);
    expect(validateNode(nav.graph, 0, 0)).toBe(false);
  });

  it('should return an empty, safe graph for an invalid layout', () => {
    const nav = buildNavGraph(undefined as unknown as DungeonLayout);

    expect(nav.findPath(0, 0, 1, 1)).toEqual([]);
    expect(validateNode(nav.graph, 0, 0)).toBe(false);
  });

  it('should re-index a new layout without leaking old nodes', () => {
    const first = buildNavGraph(makeLayout([{ x: 0, z: 0 }, { x: 1, z: 0 }]));
    const second = buildNavGraph(makeLayout([{ x: 8, z: 8 }, { x: 9, z: 8 }]));

    expect(validateNode(first.graph, 0, 0)).toBe(true);
    expect(validateNode(second.graph, 0, 0)).toBe(false);
    expect(validateNode(second.graph, 8, 8)).toBe(true);
    expect(second.findPath(8, 8, 9, 8)).toEqual([
      { x: 8, z: 8 },
      { x: 9, z: 8 },
    ]);
  });
});
