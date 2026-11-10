# Step 05-02: Auto-Idle State & Pathfinding Graph

**Goal:** Implement the module-level idle timer to seamlessly toggle the game between manual and auto modes without spamming React re-renders, and build the deterministic pathfinding graph using `ngraph.path`.

## 1. Package Installation
`ngraph.path` requires `ngraph.graph` to build the node structure. 
**Install exactly:** `ngraph.graph@^20.0.1`

## 2. API Contract: `src/store.ts`
Update the existing Zustand store to handle the auto-mode state.

**Required Additions:**
```typescript
// Inside your Zustand store interface/type:
isAutoMode: boolean;
setAutoMode: (isAuto: boolean) => void;

// Inside the create() implementation:
isAutoMode: false,
setAutoMode: (isAuto) => set({ isAutoMode: isAuto }),
```

## 3. API Contract: `src/hooks/usePlayerInput.ts` (Update)
Integrate the 10-second idle timer using a module-level variable to avoid Zustand write-spam.

**Required Logic:**
- Declare `let lastInputTime = performance.now();` OUTSIDE the hook.
- Inside the hook (e.g., in a `useFrame` or standard hook execution), read `isManual` (which is true if keys/gamepad are pressed).
- If `isManual` is true: update `lastInputTime = performance.now()` and, if `useStore.getState().isAutoMode` is true, call `setAutoMode(false)`.
- If `isManual` is false: check if `performance.now() - lastInputTime > 10000`. If so, and if `isAutoMode` is false, call `setAutoMode(true)`.
- Export `isAutoMode` from the hook alongside the previous returns.

## 4. API Contract: `src/game/pathfinding.ts`
Create this new file to generate the navigation graph once from the cached dungeon layout.

**Required Logic:**
- Import `createGraph` from `ngraph.graph` and `aStar` from `ngraph.path`.
- Iterate over the provided dungeon layout `floorCells` (from Step 4). 
- Add a node to the graph for each floor cell using its `x, z` coordinate as a unique string ID (e.g., `"${x},${z}"`).
- Add edges for valid adjacent floor cells.
- **Exported API:**
```typescript
import createGraph from 'ngraph.graph';
import { aStar } from 'ngraph.path';
import type { DungeonLayout } from '../types'; // Adjust path as needed

export function buildNavGraph(layout: DungeonLayout) {
  const graph = createGraph();
  
  // 1. Loop layout.floorCells to add graph.addNode(id, { x, z })
  // 2. Loop again to check 4-way adjacent cells and graph.addLink(idA, idB)
  
  const pathfinder = aStar(graph, {
    distance(fromNode, toNode) {
      return Math.abs(fromNode.data.x - toNode.data.x) + Math.abs(fromNode.data.z - toNode.data.z);
    }
  });

  return {
    // Returns array of {x, z} objects or empty array if no path
    findPath: (startX: number, startZ: number, targetX: number, targetZ: number) => {
      const path = pathfinder.find(`${startX},${startZ}`, `${targetX},${targetZ}`);
      return path.map(node => node.data).reverse(); // Reverse so it goes start -> end
    }
  };
}
```