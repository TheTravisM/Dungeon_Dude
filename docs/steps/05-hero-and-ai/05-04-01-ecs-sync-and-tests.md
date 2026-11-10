# Step 05-04: Visual Rotation, ECS Sync, & Pathfinding Tests

**Goal:** Polish the hero's movement by smoothly rotating the visual mesh to face the direction of travel, synchronize the hero's position/heading to the Miniplex ECS for future enemy AI to read, and verify the pathfinding logic with Vitest.

## 1. API Contract: `src/game/Hero.tsx` (Update)
Update the hero component to handle mesh rotation and Miniplex ECS synchronization.

**Required Logic:**
- **Rotation:** Calculate the target heading using `Math.atan2(move.x, move.z)` whenever the hero is moving. Smoothly rotate the visual mesh (but not the `RigidBody`) towards this angle.
- **Torch Sway:** Apply a subtle `Math.sin` sway to the `<SpotLight>`'s target or rotation so the light gently bobs as the hero walks.
- **ECS Sync:** 
  - On mount, create the hero entity in the Miniplex `world`: `const heroEntity = world.createEntity({ id: 'hero', isPlayer: true, position: [0,0,0], heading: 0 });` (Ensure it is destroyed on unmount).
  - Inside `useFrame`, update `heroEntity.position` (from Rapier translation), `heroEntity.heading`, and `heroEntity.velocity` so the ECS is strictly a data layer reflecting the physics reality.

**Reference Snippet (Rotation & ECS):**
```typescript
import { world } from '../ecs/world'; // Adjust path to your Miniplex world instance
import { damp } from 'maath/easing';

// Inside Hero component:
const visualMeshRef = useRef<THREE.Mesh>(null);
const torchRef = useRef<THREE.SpotLight>(null);
let currentHeading = 0;

// Inside useFrame:
if (isMoving || (isAutoMode && treeOutputIsMoving)) {
    const targetHeading = Math.atan2(moveDir.x, moveDir.z);
    // Smoothly interpolate rotation
    damp(visualMeshRef.current.rotation, 'y', targetHeading, 0.1, delta);
    currentHeading = visualMeshRef.current.rotation.y;
    
    // Subtle torch sway
    if (torchRef.current) {
        torchRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
    }
}

// Sync to ECS
if (heroEntity) {
    heroEntity.position = [pos.x, pos.y, pos.z];
    heroEntity.heading = currentHeading;
    heroEntity.velocity = [moveDir.x, 0, moveDir.z];
}
```

## 2. API Contract: `tests/pathfinding.test.ts`
Create this file to write the Vitest unit tests verifying `ngraph.path` execution.

**Required Logic:**
- Import `buildNavGraph` from `src/game/pathfinding.ts`.
- Mock a simple 3-cell dungeon layout (e.g., an L-shape: `[0,0], [1,0], [1,1]`).
- Assert that calling `findPath(0, 0, 1, 1)` returns the correct sequence of coordinates.
- Assert that calling `findPath(0, 0, 99, 99)` returns an empty array.

**Reference Snippet:**
```typescript
import { describe, it, expect } from 'vitest';
import { buildNavGraph } from '../src/game/pathfinding';

describe('Pathfinding Graph', () => {
  it('should find a valid path between connected cells', () => {
    const mockLayout = {
      floorCells: [
        { x: 0, z: 0 },
        { x: 1, z: 0 },
        { x: 1, z: 1 }
      ]
    } as any;
    
    const nav = buildNavGraph(mockLayout);
    const path = nav.findPath(0, 0, 1, 1);
    
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 1, z: 1 });
  });

  it('should return empty array for unreachable targets', () => {
    const mockLayout = { floorCells: [{ x: 0, z: 0 }] } as any;
    const nav = buildNavGraph(mockLayout);
    const path = nav.findPath(0, 0, 5, 5);
    
    expect(path).toEqual([]);
  });
});
```

## Execution Constraints
- Ensure Miniplex `world` is correctly imported based on the project's existing ECS structure.
- Run `npm run test` (or `npx vitest run`) locally to ensure the test passes before declaring this step complete.