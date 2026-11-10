# Step 05-03: Behavior Tree & Auto-Movement

**Goal:** Implement the Mistreevous behavior tree for the hero's auto-pilot mode and wire it into the `Hero` component so the character navigates the dungeon automatically when idle.

## 1. API Contract: `src/game/ai/HeroTree.ts`
Create this file to define the hero's utility AI using `mistreevous`. 

**Required Logic:**
- Define a `Mistreevous` behavior tree using its string definition format.
- The blackboard (state) must hold the `currentPath` (array of coordinates), `navGraph`, and the hero's current `position`.
- **Actions:**
  - `needsDestination`: Succeeds if `currentPath` is empty.
  - `findDestination`: Picks a random floor cell from the dungeon layout, uses `navGraph.findPath` to generate a route, and saves it to `currentPath`.
  - `moveAlongPath`: Calculates the directional vector to the next node in `currentPath`. Pops the node when reached.
- **Exported API:**
```typescript
import { BehaviorTree } from 'mistreevous';
import * as THREE from 'three';

const treeDefinition = `
root {
    selector {
        sequence {
            condition [ needsDestination ]
            action [ findDestination ]
        }
        action [ moveAlongPath ]
    }
}
`;

export function createHeroTree(navGraph: any, layoutCells: any[]) {
    // The blackboard object the tree will mutate and read from
    const blackboard = {
        navGraph,
        layoutCells,
        position: new THREE.Vector3(),
        currentPath: [] as {x: number, z: number}[],
        outputDirection: new THREE.Vector3(),
        
        needsDestination: () => blackboard.currentPath.length === 0,
        
        findDestination: () => {
            const target = layoutCells[Math.floor(Math.random() * layoutCells.length)];
            const startX = Math.round(blackboard.position.x);
            const startZ = Math.round(blackboard.position.z);
            
            blackboard.currentPath = navGraph.findPath(startX, startZ, target.x, target.z);
            return blackboard.currentPath.length > 0; // Succeeds if path found
        },
        
        moveAlongPath: () => {
            if (blackboard.currentPath.length === 0) return false;
            
            const nextNode = blackboard.currentPath[0];
            const targetPos = new THREE.Vector3(nextNode.x, blackboard.position.y, nextNode.z);
            const dist = blackboard.position.distanceTo(targetPos);
            
            if (dist < 0.1) {
                blackboard.currentPath.shift(); // Reached node, pop it
                blackboard.outputDirection.set(0, 0, 0);
            } else {
                blackboard.outputDirection.subVectors(targetPos, blackboard.position).normalize();
            }
            return true;
        }
    };

    const tree = new BehaviorTree(treeDefinition, blackboard);
    return { tree, blackboard };
}
```

## 2. API Contract: `src/game/Hero.tsx` (Update)
Update the hero component to consume the behavior tree when `isAutoMode` is true.

**Required Logic:**
- Initialize the behavior tree once using `useMemo`. (Assume `dungeonLayout` and `navGraph` are passed as props to `<Hero>` or retrieved from your store/context).
- Inside `useFrame`:
  - Check `useStore.getState().isAutoMode`.
  - **If Manual:** Use `direction` from `usePlayerInput()`.
  - **If Auto:** 
    - Update `tree.blackboard.position` with the `RigidBody`'s current translation.
    - Call `tree.step()`. (Mistreevous uses `.step()` to tick the tree).
    - Use `tree.blackboard.outputDirection` as the movement vector.
  - Apply the resulting directional vector to `setNextKinematicTranslation` exactly as implemented in Step 05-01.

## Execution Constraints
- Ensure the tree's output direction vector is cloned or properly applied so it does not overwrite reference objects.
- Do not remove the manual input logic; merge the two systems smoothly using the `isAutoMode` toggle.