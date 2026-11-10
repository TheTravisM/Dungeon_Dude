# Step 05-08: AI State Visualization & Path Debugging

**Goal:** Implement real-time visual feedback for the zero-player AI by rendering the calculated navigation path on the floor and displaying the active behavior tree state above the Hero. 

## 1. Context & Game Feel Upgrades
Zero-player games require clear communication of AI intent. If the Hero suddenly changes direction, the player needs to know *why*. We will use Drei's `<Line>` component to draw the active path string on the dungeon floor and Drei's `<Html>` component to float a lightweight status label (e.g., "Seeking Loot", "Wandering") directly above the character mesh.

## 2. API Contract: `src/game/ai/HeroTree.ts` (Update)
Update the blackboard to expose the active state and current path to the React render cycle.

**Required Logic:**
- Add `activeState: 'Idle'` to the blackboard.
- Update each action to mutate `blackboard.activeState` so the UI knows what is happening.
- Example: Inside `findKey`, set `blackboard.activeState = 'Seeking Key'`. Inside `findDestination`, set `blackboard.activeState = 'Wandering'`.
- Ensure `blackboard.currentPath` is easily readable by the Hero component.

## 3. API Contract: `src/game/Hero.tsx` (Update)
Inject the Drei utility components to render the AI's internal state.

**Required Logic:**
- Import `Line` and `Html` from `@react-three/drei`.
- **Path Rendering:** In the component body, extract the `currentPath` from the initialized behavior tree. Map the `{x, z}` path nodes into an array of `THREE.Vector3` or `[number, number, number]` tuples. Set the Y value to `0.85` so the line sits slightly above the floor plinth. Render the `<Line>` conditionally when `isAutoMode` is true and the path has nodes.
- **State UI:** Inside the `RigidBody`, add the `<Html>` component positioned slightly above the hero (e.g., `position={[0, 2, 0]}`). Style it with a dark, semi-transparent background and crisp white text.

**Reference Snippet (Path & UI):**
```typescript
import { Line, Html } from '@react-three/drei';
import { useMemo, useState } from 'react';

// Inside Hero component:
// We need a local React state to trigger re-renders for the UI text and line
// since the behavior tree mutates the blackboard outside of React's lifecycle.
const [aiState, setAiState] = useState('Idle');
const [debugPath, setDebugPath] = useState<[number, number, number][]>([]);

// Inside useFrame (Auto Mode block):
if (isAutoMode) {
    // ... existing tree.step() logic ...
    
    // Throttle React state updates to avoid rendering every frame
    if (Math.floor(state.clock.elapsedTime * 10) % 2 === 0) {
        setAiState(tree.blackboard.activeState);
        setDebugPath(
            tree.blackboard.currentPath.map(node => [node.x, 0.85, node.z])
        );
    }
}

// Inside JSX return, inside RigidBody:
<Html 'none' 0]} 2, center pointerEvents: position="{[0," style="{{" }}>
    {isAutoMode && (
        <div style={{ 
            background: 'rgba(0,0,0,0.7)', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'nowrap'
        }}>
            {aiState}
        </div>
    )}
</Html>

// Inside JSX return, OUTSIDE RigidBody (so it doesn't move with the hero):
{isAutoMode && debugPath.length > 1 && (
    <Line color="cyan" dashed="{false}" lineWidth="{2}" points="{debugPath}"/>
)}
```

## 4. Codebase Update: `AI_HANDOFF.md`
Finalize the Step 5 documentation.

**Target: `AI_HANDOFF.md`**
- Under "Completed Steps", append: "Added real-time AI intent visualization using Drei Html for state labeling and Drei Line for path debugging."
- Confirm "Next Step" states: "Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero's behavior tree)."

## Execution Constraints
- Ensure the `<Line>` component is rendered outside the `<RigidBody>` in the JSX tree so it remains anchored to the world, not the moving hero.
- Throttle the `useState` setters in `useFrame` as shown in the reference snippet to prevent React from choking the physics step.
- Output the complete, updated code for `Hero.tsx`, `HeroTree.ts`, and `AI_HANDOFF.md`.