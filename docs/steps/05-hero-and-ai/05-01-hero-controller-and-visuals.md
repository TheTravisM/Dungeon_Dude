# Step 05-01: Hero Controller & Visuals

**Goal:** Implement the player input hook, the kinematic physics body for the hero, smooth camera follow, and a stable torch spotlight. 

## 1. Package Installation
If not already installed via Drei, ensure `maath` is available for smooth camera damping.
**Install exactly:** `maath@^0.10.7`

## 2. API Contract: `src/hooks/usePlayerInput.ts`
Create this new file to unify keyboard and gamepad input.

**Required Logic:**
- Read keyboard state using Drei's `useKeyboardControls()[1]`.
- Poll `navigator.getGamepads()` for controller input.
- Apply a small deadzone (e.g., `0.2`) to gamepad axes.
- **Exported API:**
```typescript
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

export function usePlayerInput() {
  const [, get] = useKeyboardControls();
  // Return a normalized THREE.Vector3 for direction (x, 0, z)
  // Return boolean `isMoving`
  // Return boolean `isManual` (true if any key/stick is currently active)
}
```

## 3. API Contract: `src/game/Hero.tsx`
Create this new file. It manages the ECS entity, physics body, visual mesh, and camera follow. 

**Physics & Rendering Requirements:**
- Use `@react-three/rapier` `<RigidBody>`.
- Set `type="kinematicPosition"`, `colliders="cuboid"`, `canSleep={false}`, and `lockRotations`.
- The hero visual (a simple `<mesh>`) must be a child of the `RigidBody`.
- Apply a simple `Math.sin(state.clock.elapsedTime * speed)` to the visual mesh's Y-position when `isMoving` is true to create a walk cycle.
- **Torch:** Attach a `<SpotLight>` directly inside the `RigidBody` (not the swaying visual mesh) pointing forward or slightly down. Do not use a `PointLight`. Enable `castShadow`.

**Rapier & Camera Loop (Reference Snippet):**
```typescript
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { RapierRigidBody } from '@react-three/rapier';
import { damp3 } from 'maath/easing';
import * as THREE from 'three';

// Inside Hero component:
const bodyRef = useRef<RapierRigidBody>(null);
const speed = 5;

useFrame((state, delta) => {
  const { direction, isMoving } = usePlayerInput();
  
  if (bodyRef.current) {
    const pos = bodyRef.current.translation();
    
    // 1. Move Kinematic Body
    if (isMoving) {
      const move = direction.clone().multiplyScalar(speed * delta);
      bodyRef.current.setNextKinematicTranslation({
        x: pos.x + move.x,
        y: pos.y,
        z: pos.z + move.z
      });
    }

    // 2. Camera Follow (Offset by e.g., Y+10, Z+10 for isometric view)
    damp3(state.camera.position, [pos.x, pos.y + 10, pos.z + 10], 0.2, delta);
    state.camera.lookAt(pos.x, pos.y, pos.z);
  }
});
```

## 4. Codebase Update
**Target: `src/game/App.tsx`**
- Import and render `<Hero />` inside the `<Physics>` block, ensuring it sits on the dungeon floor (e.g., initial position `[0, 1.5, 0]`).
- Ensure Drei's `<KeyboardControls>` wraps the canvas or the application if it doesn't already, mapping standard WASD and Arrow keys.