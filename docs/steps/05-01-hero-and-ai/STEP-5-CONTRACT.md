# Step 5 Contract: Hero and Autonomous AI

Shared reference for every micro-step in this folder. Each task file tells you which sections to read. Read only those sections, not the whole file, when context is tight.

Verified on 2026-11-09 against the installed typings of `@react-three/rapier` 2.2.0 (bundles Rapier 0.19.2), `three` 0.187, `miniplex` 2.0.0, and the registry versions below. If the local source or typings disagree with this file, stop and report the exact conflict.

---

## 1. Decisions (approved 2026-11-09)

| Area | Decision | Reason |
|---|---|---|
| Physics | Rapier low-level `world.createCharacterController(offset)` driven from `useBeforePhysicsStep` | There is no React controller component in `@react-three/rapier` 2.2.0 |
| Pathfinding | Reuse the existing `findGridPath` in `src/game/dungeon/pathfinding.ts` (deterministic BFS). Do NOT add `ngraph.path` | Already committed, tested by the 500-seed verifier, and equal to A* on a uniform-cost 4-direction grid |
| Decision layer | `mistreevous` 4.3.1 behavior tree, stepped at 5 Hz, seeded `random` | One readable tree grows through Steps 6 to 9 (fight, loot, key, stairs) |
| Torch light | One shadow-casting `SpotLight` (1 shadow map) plus one no-shadow warm `PointLight` | A shadow-casting PointLight renders six shadow passes |
| Input | Small native key tracker plus native Gamepad poll | Drei `KeyboardControls` cannot clear held keys on window blur (its typed API exposes only `subscribe` and `getState`) and never calls `preventDefault`, so a stuck key would lock the hero in manual mode forever |
| Smoothing | `maath` 0.10.8 `easing.damp3`, `easing.dampAngle` | Frame-rate independent smoothing; `dampAngle` takes the shortest arc |
| Tests | `vitest@^3.2.7` (devDependency), node environment, pure modules only | Vitest 4 and 5 require Vite 6 or later; this project is pinned to Vite 5 |
| ECS | Stay on `miniplex@2.0.0` (handoff section 2.3) | Frozen but stable since 2023; `koota` is the active alternative but is not adopted mid-project |

New runtime dependencies for Step 5: `mistreevous`, `maath`. New dev dependency: `vitest`. Nothing else. All three are installed once, in 05-00.

---

## 2. World conventions

- One world unit is one tile. Grid cell `(x, z)` maps to world with `gridToWorld(c) = c - (size - 1) / 2` (`src/game/dungeon/constants.ts`). Cell centers sit at half units (-9.5 to 9.5). 05-08 adds the inverse `worldToGrid(w) = Math.round(w + (size - 1) / 2)` next to it.
- Walkable surface is `FLOOR_TOP = 0.06`. The plinth top is `y = 0`.
- Corridors are ONE tile wide. A hero needs `HERO_RADIUS + HERO_CONTROLLER_OFFSET <= 0.5`; this contract uses 0.30, leaving 0.20 of clearance on each side of a centered hero.
- All wall colliders are full height (2.2) even where the visible ledge is low (0.6). The hero can never step onto a ledge.
- `layout.spawn` is already in world coordinates with `y = FLOOR_TOP`. `rooms[0]` is the start room; `room.center` is a `GridCell` on floor.
- Camera sits at offset `(20, 20, 20)` from its focus and looks at it. Screen directions on the ground plane:
  - screen up (forward) = `(-0.7071, 0, -0.7071)`
  - screen right = `(+0.7071, 0, -0.7071)`
  - So W moves toward `-x,-z`, D moves toward `+x,-z`, S toward `+x,+z`, A toward `-x,+z`.
- The hero model faces local `+Z`. `heading = Math.atan2(dirX, dirZ)` is the Y rotation that turns the model toward a direction.

---

## 3. Tuning constants (created in 05-01 as `src/game/hero/constants.ts`)

```ts
export const HERO_RADIUS = 0.28;
export const HERO_HEIGHT = 1.05;                 // full capsule height, caps included
export const HERO_CAPSULE_HALF_HEIGHT = (HERO_HEIGHT - 2 * HERO_RADIUS) / 2;
export const HERO_GROUND_CLEARANCE = 0.02;       // capsule bottom floats this far above FLOOR_TOP
export const HERO_CAPSULE_CENTER_Y =
  HERO_GROUND_CLEARANCE + HERO_CAPSULE_HALF_HEIGHT + HERO_RADIUS;
export const HERO_CONTROLLER_OFFSET = 0.02;      // Rapier skin gap
export const HERO_SPEED = 3.0;                   // world units per second
export const HERO_IDLE_RETURN_MS = 4000;         // the ONLY place the 4 second rule lives
export const HERO_BRAIN_HZ = 5;                  // approved 4 to 10 Hz band
export const HERO_WAYPOINT_REACH = 0.12;
export const HERO_STUCK_WINDOW_MS = 1000;
export const HERO_STUCK_MIN_PROGRESS = 0.3;      // world units moved per window
export const HERO_PATH_CLEARANCE = 0.32;         // smoothing sweep radius
export const GAMEPAD_DEADZONE = 0.25;
```

Body origin is at the hero's FEET (`y = FLOOR_TOP`). The capsule collider is offset up by `HERO_CAPSULE_CENTER_Y`. The visual model has its feet at local `y = 0`.

---

## 4. Architecture and data flow

```
keyboard + gamepad --> inputState (module, no React) --+
                                                       v
brain (5 Hz) --> route (module) --> resolveHeroDirection(now) --> useHeroMovement
                                      manual wins while                 |
                                      now - lastActiveAt < 4000 ms      v
                                                         Rapier controller + kinematic body
                                                                        |
                                           ECS hero entity (position, velocity, heading)
                                              |            |             |
                                        animation     camera follow     brain
```

Rules:
- Per-frame data (position, velocity, heading, route, input axes, idle clock) lives in the ECS entity or module-level objects. Never in React state or Zustand.
- Zustand receives only coarse flips: `setAutoPlaying(boolean)` when manual and auto mode switch, and `updateLastInputTime()` once on each manual takeover. It is never written per frame.
- Idle logic reads the module-level `lastActiveAt` timestamp, not the Zustand `lastInputTime`. The store value exists for the HUD only.
- Movement runs inside `useBeforePhysicsStep` at the fixed `PHYSICS_TIME_STEP` (1/60). Animation and camera run in `useFrame`.
- `<Hero key={layout.seed} />` so a new depth remounts the hero: new entity, body, controller, route, and brain.

---

## 5. File map

```
src/game/hero/
  constants.ts                       05-01
  isoMovement.ts (+ .test.ts)        05-04   axes to world direction
  input/keyTracker.ts (+ .test.ts)   05-04   pure held-key tracker
  input/gamepad.ts (+ .test.ts)      05-04   pure axis/button reader
  input/manualControl.ts (+ .test)   05-04   idle clock rule
  input/inputState.ts                05-04   module singleton + listeners
  navigation/walkGrid.ts             05-08
  navigation/heroPath.ts (+ .test)   05-08
  navigation/smoothPath.ts (+ .test) 05-09
  navigation/routeState.ts (+ .test) 05-10   module singleton: current route
  navigation/route.ts (+ .test)      05-12   waypoint follower
  ai/exploreGoals.ts (+ .test)       05-11
  ai/stuckDetector.ts (+ .test)      05-11
  ai/heroBrain.ts                    05-13
  ai/exploreSim.test.ts              05-14   headless 50-seed simulation
  ai/mistreevous.test.ts             05-00   pins library behavior
  intent.ts (+ .test)                05-12   resolveHeroDirection
src/hooks/hero/
  useHeroEntity.ts                   05-01
  useHeroMovement.ts                 05-05
  useHeroRig.ts                      05-02
  useHeroAnimation.ts                05-06
  useTorchFlicker.ts                 05-03
  useHeroBrain.ts                    05-13
src/components/hero/
  Hero.tsx                           05-01
  HeroModel.tsx                      05-02
  HeroTorch.tsx                      05-03
  InputBridge.tsx                    05-04   installs listeners, polls input
src/components/scene/CameraFollow.tsx   05-07
src/components/debug/HeroDebugReadout.tsx   05-04
src/components/debug/PathDebug.tsx          05-10
vitest.config.ts                     05-00
```

Keep every file under 200 lines. Place new tests next to the module as `*.test.ts`.

---

## 6. Verified API reference

### 6.1 Rapier character controller (`@dimforge/rapier3d-compat` 0.19.2)

```ts
const { world } = useRapier();                       // world: Rapier World
const controller = world.createCharacterController(0.02);   // offset
world.removeCharacterController(controller);         // cleanup

controller.setSlideEnabled(true);
controller.disableAutostep();                        // never climb ledges
controller.disableSnapToGround();                    // flat floor, no jumping
controller.setApplyImpulsesToDynamicBodies(false);

controller.computeColliderMovement(collider, { x, y: 0, z });  // optional filters follow
const m = controller.computedMovement();             // { x, y, z }, collision resolved
```

- `computeColliderMovement(collider, desiredDelta, filterFlags?, filterGroups?, filterPredicate?)`. The character's own collider is ignored automatically.
- The controller applies no gravity and supports translation only.
- Do not change the offset after creation. If the hero snags, raise the offset slightly, do not write collision math.
- Apply the result to a `kinematicPosition` body: `body.setNextKinematicTranslation({ x, y, z })`.
- Ignore `m.y`. Keep `y = FLOOR_TOP` so the hero never drifts vertically.

### 6.2 `@react-three/rapier` 2.2.0

```tsx
import {
  RigidBody, CapsuleCollider, useRapier, useBeforePhysicsStep,
  type RapierRigidBody, type RapierCollider,
} from '@react-three/rapier';

useBeforePhysicsStep((world) => { /* runs before every fixed step; world is the Rapier World */ });

<RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} canSleep={false}
          position={[x, y, z]}>
  <CapsuleCollider ref={colliderRef} args={[halfHeight, radius]} position={[0, centerY, 0]} />
  {/* visuals as children */}
</RigidBody>
```

- `CapsuleCollider` args are `[halfHeight, radius]`, where `halfHeight` is the straight cylinder part only.
- `bodyRef` is `RapierRigidBody`, `colliderRef` is `RapierCollider`. Both refs may be null on the first render; guard before use.
- Interpolation (`interpolate` is on in `GamePhysics`) applies to kinematic bodies. Visual meshes MUST be children of the `RigidBody` so they follow the interpolated transform. Rotate an inner group for facing, not the body.
- `body.translation()` returns a small new object each call. That allocation is acceptable once per physics step.

### 6.3 miniplex 2.0.0

`import { world, heroQuery, createHero } from '../game/ecs'`. `heroQuery.first` is the single hero or `undefined`. `heroQuery.size` is the count. `world.remove(entity)` removes it.

### 6.4 mistreevous 4.3.1 (CommonJS package)

```ts
import { BehaviourTree, State } from 'mistreevous';
const tree = new BehaviourTree(definitionString, agentObject, { random: rng });
tree.step();      // one tick; a finished tree resets itself on the next step
tree.reset();     // abort running nodes
```

Agent action methods return `State.SUCCEEDED`, `State.FAILED`, or `State.RUNNING`. Condition methods return a boolean. Method names in the MDSL string must match agent property names. If the named import fails under Vite, use the default-import interop fallback and report it.

### 6.5 maath 0.10.8

```ts
import { easing } from 'maath';
easing.damp3(vector3, [x, y, z], smoothTimeSeconds, delta);   // mutates vector3
easing.dampAngle(object, 'y', targetAngle, smoothTimeSeconds, delta);
```

### 6.6 Three.js SpotLight target gotcha

A `SpotLight` aims at `light.target`, which defaults to an object at world origin that is NOT in the scene. A light parented to a moving hero would keep aiming at the origin. Add an `<object3D>` as a sibling inside the same hero group, then assign `light.target = targetRef.current` in a layout effect. The target must be in the scene graph so its world matrix updates.

### 6.7 Drei

`Sparkles` (props: `count`, `speed`, `opacity`, `color`, `size`, `scale`, `noise`) is already installed and is used for embers. `Line` or a plain three `Line` is acceptable for the path debug view.

---

## 7. Known risks and fallbacks

- **Floor seam snag.** Floor colliders are merged cuboids. If the hero catches on a seam, first raise `HERO_GROUND_CLEARANCE` to 0.03. Do not add custom collision code.
- **Corner snag in 1-wide corridors.** Steer to cell centers only, reach radius `HERO_WAYPOINT_REACH`. Never aim a waypoint at a wall-adjacent point.
- **StrictMode.** Effects mount, clean up, and mount again in development. Every listener, entity, and controller must be released in cleanup.
- **Timing of refs.** Child colliders exist before the parent `useEffect` runs, but guard for null anyway inside step callbacks.
- **Lighting balance.** The existing key light (intensity 3.4) and ambient (1.1) may drown the torch. Reduce them in `Lighting.tsx` only as far as needed and ask the user to confirm by eye.
- **Zoom.** The current zoom of 40 draws the hero about 42 px tall. 05-07 moves zoom into one constant and asks the user to choose between 40 and about 64.

---

## 8. Out of scope for Step 5

Monsters, attacks and sword hits (the Space key is mapped and counts as manual input, but does nothing else yet), damage, chests, keys, doors, stairs and descending, traps, props, wall torches, HUD, menus, audio. Step 6 and later add branches to the behavior tree; do not pre-build them.
