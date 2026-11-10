# Step 05-05: Hero AI Interactions & Step 5 Wrap-up

**Goal:** Expand the Mistreevous behavior tree so the hero actively seeks out Points of Interest (POIs) like loot, keys, and stairs using the Miniplex ECS, and finalize the Step 5 handoff documentation.

## 1. API Contract: `src/types/index.ts` (Update)
Update the ECS `Entity` type to support POIs so the Hero can query the world state.

**Required Additions:**
```typescript
export type Entity = {
  id: string;
  // Existing components...
  
  // Additions for POIs:
  poiType?: 'loot' | 'key' | 'stairs' | 'enemy';
  isActive?: boolean; // True if the POI hasn't been looted/used yet
};
```

## 2. API Contract: `src/game/ai/HeroTree.ts` (Update)
Expand the behavior tree definition and blackboard to prioritize objectives. 

**Required Logic:**
- Update the tree string to use a `selector` that evaluates priorities: 
  1. If `needsKey` is true, find the key and move to it.
  2. If `hasKey` is true, find the stairs and move to them.
  3. Otherwise, explore (the existing `findDestination` logic).
- Pass the Miniplex `world` instance into `createHeroTree` so the blackboard can query `world.with('poiType', 'position', 'isActive')`.

**Reference Snippet (Tree & Blackboard update):**
```typescript
const treeDefinition = `
root {
    selector {
        sequence {
            condition [ needsKey ]
            sequence {
                condition [ needsDestination ]
                action [ findKey ]
            }
            action [ moveAlongPath ]
            action [ interact ]
        }
        sequence {
            condition [ hasKey ]
            sequence {
                condition [ needsDestination ]
                action [ findStairs ]
            }
            action [ moveAlongPath ]
            action [ interact ]
        }
        sequence {
            condition [ needsDestination ]
            action [ findDestination ]
        }
        action [ moveAlongPath ]
    }
}
`;

// Inside createHeroTree(navGraph, layoutCells, world):
// Add these to the blackboard:
hasKey: false,
needsKey: () => !blackboard.hasKey,

findKey: () => {
    // Query ECS for active key
    const keyEntity = world.with('poiType', 'position', 'isActive')
                           .entities.find(e => e.poiType === 'key' && e.isActive);
    if (!keyEntity) return false;
    
    const startX = Math.round(blackboard.position.x);
    const startZ = Math.round(blackboard.position.z);
    blackboard.currentPath = navGraph.findPath(startX, startZ, keyEntity.position[0], keyEntity.position[2]);
    return blackboard.currentPath.length > 0;
},

findStairs: () => {
    const stairsEntity = world.with('poiType', 'position', 'isActive')
                              .entities.find(e => e.poiType === 'stairs' && e.isActive);
    if (!stairsEntity) return false;
    
    const startX = Math.round(blackboard.position.x);
    const startZ = Math.round(blackboard.position.z);
    blackboard.currentPath = navGraph.findPath(startX, startZ, stairsEntity.position[0], stairsEntity.position[2]);
    return blackboard.currentPath.length > 0;
},

interact: () => {
    if (blackboard.currentPath.length === 0) {
        // We reached the destination. 
        // In a full implementation, trigger a Zustand action here based on proximity.
        blackboard.hasKey = true; // Mock picking up the key
        return true; 
    }
    return false;
}
```

## 3. Codebase Update: `AI_HANDOFF.md`
Update the handoff document to mark Step 5 as fully complete.

**Target: `AI_HANDOFF.md`**
- Under "Completed Steps", add a summary for Step 5: "Implemented Hero Kinematic controller, maath camera dampening, unified Gamepad/Keyboard input, Mistreevous behavior tree for auto-movement, Miniplex ECS sync, and Vitest pathfinding verification."
- Under "Next Step", write: "Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero's behavior tree)."

## Execution Constraints
- Do not modify `App.tsx` or `Hero.tsx`. The tree's internal logic should handle the new actions without touching the React render cycle.
- Output the complete code for the updated files.