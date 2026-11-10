# Step 05-07-01: Cinematic Camera Look-Ahead & Ambient Torch Dynamics

**Goal:** Finalize the visual polish of the Hero component by introducing a velocity-based cinematic camera look-ahead, applying a multi-frequency procedural flicker to the torch light, and permanently closing out Step 5 in the handoff document.

## 1. Context & Game Feel Upgrades
A static camera following a centered character makes a game feel rigid. By offsetting the camera's target slightly in the direction the hero is moving, the player naturally sees more of what lies ahead. Additionally, a static spotlight feels synthetic; real dungeon torches flicker chaotically. We will use a composite sine/cosine wave to drive light intensity, creating a warm, organic flame effect without the overhead of a particle system.

## 2. API Contract: `src/game/Hero.tsx` (Update)
Inject the camera offset and torch flicker math into the existing `useFrame` loop.

**Required Logic:**
- **Torch Component:** Update the `<SpotLight>` properties to use a warm color (e.g., `#ffb74d`), a wider angle (e.g., `0.6`), and a soft penumbra (e.g., `0.5`).
- **Torch Flicker:** Inside `useFrame`, modulate the spotlight's `intensity` using `state.clock.elapsedTime`. Combine at least two trigonometric functions with prime number multipliers (e.g., 17 and 23) to avoid repeating visual patterns.
- **Camera Look-Ahead:** Calculate a `targetCamPos` that adds the current movement vector (multiplied by a look-ahead factor like `2.5`) to the hero's base position. Damp the camera to this new target instead of the raw position.

**Reference Snippet (Camera & Torch Polish):**
```typescript
// Inside useFrame:
const t = state.clock.elapsedTime;

// 1. Cinematic Camera Look-Ahead
// Offset the camera 10 units up, 10 units back, PLUS a push in the movement direction
const lookAheadFactor = 2.5; 
const targetCamPos = [
    pos.x + (moveDir.x * lookAheadFactor),
    pos.y + 10,
    pos.z + 10 + (moveDir.z * lookAheadFactor)
];
damp3(state.camera.position, targetCamPos, 0.2, delta);
state.camera.lookAt(pos.x, pos.y, pos.z);

// 2. Organic Torch Flicker & Sway
if (torchRef.current) {
    // Base intensity + high frequency chaos + low frequency wave
    const flicker = Math.sin(t * 17) * 0.15 + Math.cos(t * 23) * 0.15;
    torchRef.current.intensity = 2.0 + flicker;
    
    // Existing sway from Step 05-04
    torchRef.current.position.y = 0.5 + Math.sin(t * 8) * 0.05;
}
```

## 3. Codebase Update: `AI_HANDOFF.md`
Update the handoff document to wrap up the Step 5 series permanently.

**Target: `AI_HANDOFF.md`**
- Under "Completed Steps", append: "Added cinematic camera look-ahead based on velocity and integrated procedural multi-frequency torch flicker for ambient dungeon lighting."
- Confirm "Next Step" states: "Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero's behavior tree)."

## Execution Constraints
- Do not instantiate new `THREE.Vector3` objects inside `useFrame` if it can be avoided (passing arrays to `damp3` as shown above prevents garbage collection stutter).
- Output the complete, updated code for `Hero.tsx` and the updated text block for `AI_HANDOFF.md`.