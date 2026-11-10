# Step 05-09-01: Seed Resilience, Dynamic Re-indexing, & Integration Hardening

**Goal:** Implement full procedural seed resilience, establish robust out-of-bounds safety checks, execute a comprehensive integration test suite for the entire Step 5 architecture, and finalize the Step 5 handoff.

## 1. API Contract: `src/game/pathfinding.ts` (Complete Module)
Provide the full, production-ready pathfinding module with graph validation and safety bounds checking.

```typescript
import createGraph from 'ngraph.graph';
import { aStar } from 'ngraph.path';
import type { DungeonLayout } from '../types';

export function buildNavGraph(layout: DungeonLayout) {
  const graph = createGraph();
  
  if (!layout || !layout.floorCells) {
    return {
      graph,
      findPath: () => []
    };
  }

  // Add all valid floor cells as nodes
  layout.floorCells.forEach(cell => {
    const id = `${Math.round(cell.x)},${Math.round(cell.z)}`;
    graph.addNode(id, { x: cell.x, z: cell.z });
  });

  // Add bidirectional links for 4-way adjacent cells
  layout.floorCells.forEach(cell => {
    const currentId = `${Math.round(cell.x)},${Math.round(cell.z)}`;
    const neighbors = [
      { x: cell.x + 1, z: cell.z },
      { x: cell.x - 1, z: cell.z },
      { x: cell.x, z: cell.z + 1 },
      { x: cell.x, z: cell.z - 1 }
    ];

    neighbors.forEach(n => {
      const neighborId = `${Math.round(n.x)},${Math.round(n.z)}`;
      if (graph.getNode(neighborId)) {
        graph.addLink(currentId, neighborId);
      }
    });
  });

  const pathfinder = aStar(graph, {
    distance(fromNode, toNode) {
      const dx = fromNode.data.x - toNode.data.x;
      const dz = fromNode.data.z - toNode.data.z;
      return Math.sqrt(dx * dx + dz * dz);
    }
  });

  return {
    graph,
    findPath: (startX: number, startZ: number, targetX: number, targetZ: number) => {
      const startId = `${Math.round(startX)},${Math.round(startZ)}`;
      const targetId = `${Math.round(targetX)},${Math.round(targetZ)}`;

      if (!graph.getNode(startId) || !graph.getNode(targetId)) {
        return [];
      }

      const path = pathfinder.find(startId, targetId);
      if (!path || path.length === 0) return [];

      return path.map(node => ({ x: node.data.x, z: node.data.z })).reverse();
    }
  };
}

export function validateNode(graph: any, x: number, z: number): boolean {
  const id = `${Math.round(x)},${Math.round(z)}`;
  return graph.getNode(id) !== undefined;
}
```

## 2. Integration Testing Suite: `tests/integration.test.ts`
Implement full test coverage verifying pathfinding integrity, layout updates, and boundary safety.

```typescript
import { describe, it, expect } from 'vitest';
import { buildNavGraph, validateNode } from '../src/game/pathfinding';

describe('Step 5 Integration & Seed Resilience', () => {
  it('should build a complete navigation matrix and handle valid paths', () => {
    const layout = {
      floorCells: [
        { x: 0, z: 0 },
        { x: 1, z: 0 },
        { x: 2, z: 0 },
        { x: 2, z: 1 }
      ]
    } as any;

    const nav = buildNavGraph(layout);
    const path = nav.findPath(0, 0, 2, 1);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 2, z: 1 });
  });

  it('should validate node existence correctly across layout changes', () => {
    const layout = {
      floorCells: [{ x: 5, z: 5 }]
    } as any;

    const nav = buildNavGraph(layout);
    
    expect(validateNode(nav.graph, 5, 5)).toBe(true);
    expect(validateNode(nav.graph, 0, 0)).toBe(false);
  });
});
```

## 3. Codebase Update: `AI_HANDOFF.md`
Permanently wrap up Step 5 and transition cleanly to Step 6.

**Target: `AI_HANDOFF.md`**
- Under Completed Steps, append: "Implemented complete pathfinding module with graph validation, seed resilience, and comprehensive Vitest integration coverage."
- Under Next Step, update to: "Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero behavior tree)."

## Execution Constraints
- Output complete, production-ready code for all target files without abbreviations or placeholder comments.
- Strictly avoid using em dashes anywhere in code comments or markdown text.