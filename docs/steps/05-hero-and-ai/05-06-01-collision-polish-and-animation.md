# Step 05-06-01: Character Controller & Procedural Polish

**Goal:** Upgrade the Hero's raw kinematic movement to use Rapier's Character Controller for smooth wall sliding (preventing clipping), add a procedural squash-and-stretch walk cycle, and finalize the handoff document.

## 1. API Contract: `src/game/Hero.tsx` (Update)
Integrate Rapier's KCC and procedural scaling.

**Required Logic:**
- Import `useRapier` from `@react-three/rapier`.
- Create the character controller in a `useMemo` so it persists across frames. Configure it with a small offset (e.g., `0.05`). **Crucial:** Do not enable `autostep`, so the hero cannot climb the 0.75 walls.
- In `useFrame`, fetch the hero's collider: `const collider = bodyRef.current.collider(0);`.
- Use `characterController.computeColliderMovement(collider, moveDirection)` instead of blindly applying the movement vector.
- Apply `characterController.computedMovement()` to `setNextKinematicTranslation`.
- **Procedural Animation:** When moving, use `Math.sin(state.clock.elapsedTime * walkSpeed)` to slightly squash and stretch the `visualMeshRef.current.scale` (e.g., Y expands, X/Z contract). Reset scale to `[1,1,1]` when idle.

**Reference Snippet (Rapier KCC & Animation):**
```typescript
import { useRapier } from '@react-three/rapier';
import { damp3 } from 'maath/easing';

// Inside Hero component:
const { world } = useRapier();
const characterController = useMemo(() => {
    const cc = world.createCharacterController(0.05);
    // Ensure autostep is off so we don't climb the diorama walls
    return cc;
}, [world]);

// Inside useFrame movement block (assuming `move` is the raw Vector3 movement):
if (isMoving && bodyRef.current) {
    const collider = bodyRef.current.collider(0);
    if (collider) {
        // 1. Compute safe movement (slides along walls instead of clipping)
        characterController.computeColliderMovement(collider, move);
        const corrected = characterController.computedMovement();
        
        // 2. Apply safe movement
        bodyRef.current.setNextKinematicTranslation({
            x: pos.x + corrected.x,
            y: pos.y + corrected.y,
            z: pos.z + corrected.z
        });

        // 3. Procedural Squash & Stretch Walk Cycle
        const walkCycle = Math.sin(state.clock.elapsedTime * 15);
        visualMeshRef.current.scale.set(
            1 - walkCycle * 0.05, // Squash X
            1 + walkCycle * 0.1,  // Stretch Y
            1 - walkCycle * 0.05  // Squash Z
        );
    }
} else {
    // Smoothly return to resting scale when idle
    damp3(visualMeshRef.current.scale, [1, 1, 1], 0.1, delta);
}
```

## 2. Codebase Update: `AI_HANDOFF.md`
Over-write the previous Step 5 completion summary to include these new physics upgrades.

**Target: `AI_HANDOFF.md`**
- Under "Completed Steps", append: "Upgraded Hero physics to use Rapier's Kinematic Character Controller for safe wall-sliding and added procedural squash-and-stretch walk cycle animations."
- Ensure "Next Step" states: "Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero's behavior tree)."

## Execution Constraints
- Ensure the `useMemo` for the Character Controller safely relies on the `world` dependency.
- Output the complete code for `Hero.tsx` and the updated lines for `AI_HANDOFF.md`.
- No new packages need to be installed.