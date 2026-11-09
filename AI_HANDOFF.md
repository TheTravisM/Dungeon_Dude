# Dungeon Dude - AI Handoff

Last updated: 2026-11-08
Maintained by: the current AI coding agent
Purpose: authoritative context for any model taking over this project.

Read this file first. Then read these files in order:
1. `Dungeon_Dude_Plan.md` - the step-by-step product plan.
2. `.cursorrules` - architecture and interaction rules.
3. `package.json` and `vite.config.ts` - the actual installed toolchain.
4. `src/App.tsx` and `src/components/` - the current scene.

This document is a living log. Update it at the end of every step, immediately before the Git commit for that step.

---

## 1. Current Status

- **Current step:** Step 3 (ECS Architecture and Physics Setup) is implemented, browser-verified, and approved by the user on 2026-11-08.
- **Last committed step:** Step 2, commit `c4a6b44 feat: add miniature diorama post-processing pipeline`.
- **Step 3 commit status:** Committed together with this handoff document under `feat: add ECS foundation and Rapier physics`.
- **Expected dirty files for the Step 3 commit:** `package.json`, `package-lock.json`, `src/App.tsx`, `src/App.module.scss`, `src/components/scene/Floor.tsx`, `src/vite-env.d.ts`, `src/game/constants.ts`, `src/game/ecs.ts`, `src/game/store.ts`, `src/components/physics/GamePhysics.tsx`, `src/components/physics/FloorCollider.tsx`, `src/components/physics/PhysicsProbe.tsx`, and this file.

#### Baseline correction (2026-11-08, micro-step 4.00)

The Step 3 statements above are preserved as history, but the current local checkout does not match them. A read-only audit at HEAD `417fe2a` found:

- `npx tsc -b --pretty false` and `npm run build` fail with exit code 1. `npm run lint` passes.
- `FLOOR_THICKNESS` is imported by `Floor.tsx` and `FloorCollider.tsx` but is no longer exported by `src/game/constants.ts`.
- `GameState` requires `debugPanelOpen`, `physicsDebug`, `toggleDebugPanel`, and `togglePhysicsDebug`, but `src/game/store.ts` does not implement them.
- Commit `c133a6c` caused both failures: it deleted `FLOOR_THICKNESS` and added the four required `GameState` members without updating the store. It also added an unapproved early dungeon generator under `src/game/dungeon/`.
- The dungeon generator is not composed into `App.tsx`; it has no renderer, collider, or plinth. Its corridors are two tiles wide, it always produces exactly four rooms, and its tall walls are incidental rather than a guaranteed far-edge backdrop.
- `INDEX.md` says `.cursorrules` contains architecture rules only, but the actual `.cursorrules` also contains the older five-stage interaction loop. The prompt-pack rules in `INDEX.md` govern the micro-step workflow; this factual conflict is recorded rather than silently resolved.

Do not redo approved Step 3 work. Repair the two compile failures in micro-step 4.01, then refine the existing generator in 4.02 through 4.05.

Update (2026-11-08, micro-step 4.01): both compile failures are repaired. `FLOOR_THICKNESS` is restored in `src/game/constants.ts`, and `src/game/store.ts` now implements the four debug members. TypeScript, lint, and production build pass.

### Step 0 - Foundational architecture

Committed as `25a4fbe chore: initial commit with foundational architecture`.

### Step 1 - App scaffold and base scene

Committed as `239dc7c feat: scaffold app and isometric base scene`.

Completed:
- `src/main.tsx` mounts `App` into `#root` and imports `global.scss`.
- `src/App.tsx` owns the Canvas layer and the DOM overlay layer.
- `src/components/scene/IsometricCamera.tsx` creates a fixed orthographic camera.
- `src/components/scene/Lighting.tsx` creates a cool ambient fill and a warm shadow-casting directional key.
- `src/components/scene/Floor.tsx` creates a 20x20 stone floor with a Drei Grid overlay.
- `src/components/scene/ReferenceBlock.tsx` is a temporary shadow probe.
- `src/App.module.scss` establishes the z-index stacking.

### Step 2 - Post-processing

Completed and verified:
- `src/components/Effects.tsx` composes TiltShift, Dither, Noise, and Vignette.
- `src/components/effects/Dither.ts` implements a custom 4x4 Bayer dither effect because the library no longer ships one.
- `src/App.tsx` now renders `<Effects />` after the scene meshes.
- Canvas uses `shadows="percentage"` to avoid the removed `PCFSoftShadowMap` warning.

Verification already performed:
- `npx tsc -b` passes.
- `npm run lint` passes.
- `npm run build` passes with exit code 0.
- Headless Chrome screenshot and a cropped/upscaled screenshot confirm the effects render.
- Browser console contains no shader or WebGL errors. The only remaining warning is `THREE.Clock: deprecated`, emitted by R3F 9 internals.

### Step 3 - ECS foundation and Rapier physics

Implemented and headless-verified; awaiting user approval:

- `src/game/constants.ts` owns `FLOOR_SIZE`, `FLOOR_THICKNESS`, `PHYSICS_TIME_STEP`, and `GRAVITY`. `Floor.tsx` and `FloorCollider.tsx` both read from it, so the visual slab and the collision slab cannot drift.
- `src/game/ecs.ts` owns the single module-level `World<Entity>` from `miniplex@2.0.0`, plus `heroQuery`, `monsterQuery`, `propQuery`, and `createHero`/`createMonster`/`createProp` factories. No React imports.
- `src/game/store.ts` implements `GameState` with Zustand 5. `VITE_STARTING_LEVEL` seeds `currentDepth` and falls back to 1.
- `src/components/physics/GamePhysics.tsx` wraps the scene in `<Physics>` with fixed `1/60` timestep, interpolation, gravity, and the debug flag.
- `src/components/physics/FloorCollider.tsx` is one fixed cuboid collider matching the visual floor exactly.
- `src/components/physics/PhysicsProbe.tsx` is the temporary falling box. It must be deleted when Step 4/5 land.
- The DOM badge reads `currentDepth` from the store and shows "Step 3 - ECS and Physics".
- `@miniplex/core` and `@miniplex/react` were uninstalled. Root `zustand` is now 5.1.0. `react` and `react-dom` are pinned to `~19.3.1`.

Verification performed:
- `npx tsc -b --pretty false` passes.
- `npm run lint` passes.
- `npm run build` passes (bundle ~3.51 MB, gzip ~1.19 MB, expected because of the Rapier WASM).
- Headless Chrome at 1200 ms and 2500 ms shows the probe falling and then resting on the floor, with the pink Rapier debug wireframe around the box and the yellow debug outline around the floor collider.
- The probe is still resting on the floor at 8000 ms. The 4000 ms and 8000 ms captures that included the post-processing pipeline came out blank, but a control run with `EFFECTS_ENABLED = false` rendered correctly at both durations. Console output at 4000 ms contains no app, shader, or WebGL errors, so the blank frames are a headless `EffectComposer`/SwiftShader readback artifact, not an app regression. `EFFECTS_ENABLED` was restored to `true` afterwards.
- Remaining console noise: `THREE.Clock` deprecation (R3F 9 internals) and the Rapier "using deprecated parameters for the initialization function" warning (from `@react-three/rapier` internals).
- User browser-verified both conditions on 2026-11-08: probe falls and settles, debug wireframes show only when `VITE_DEBUG_PHYSICS=true`, badge is correct, effects look right with debug off, no console errors.

---

## 2. Architectural Decisions

This section is the authoritative decision log. Do not silently reverse these choices.

### 2.1 React 19 Compiler is active through Babel

- `package.json` uses `@vitejs/plugin-react` 4.7.0, not `@vitejs/plugin-react-swc`.
- `babel-plugin-react-compiler` 1.0.0 is installed.
- `vite.config.ts` enables the compiler with `target: '19'`.
- Reason: the React Compiler requires Babel. The SWC plugin cannot run it.
- Do not upgrade `@vitejs/plugin-react` past 4.x unless Vite is also upgraded. The current latest plugin-react 6.x requires Vite 8 and a different compiler integration. This project uses Vite 5.4.x by design.
- Do not add manual `useMemo` or `useCallback` just for memoization. Write compiler-friendly code and let the compiler optimize it.

### 2.2 R3F stack versions

Installed and verified:
- `@react-three/fiber` 9.8.2
- `@react-three/drei` 10.7.9
- `@react-three/postprocessing` 3.2.2
- `@react-three/rapier` 2.2.0
- `postprocessing` 6.39.6
- `three` 0.187.0
- `react` and `react-dom` 19.3.1

Reasons:
- R3F 9 and Drei 10 are the React 19 compatible line.
- `postprocessing` 6.39 requires `three >= 0.168`, which is why `three` was raised from 0.167 to 0.187.
- Do not downgrade `three` below 0.168 while `postprocessing` 6.39 is installed.
- R3F 9's peer range is `react >=19 <19.4`. `package.json` currently has `react: ^19.0.0`, which would allow a future React 19.4 to break the peer range. Pin `react` and `react-dom` to `~19.3.1` before any future `npm install` if the project is not already pinned.

### 2.3 ECS package decision: stable `miniplex@2.0.0` only

This is the highest-priority Step 3 decision.

Installed:
- `miniplex` 2.0.0, which uses `@miniplex/bucket`. API: `new World<Entity>()`, `world.add`, `world.with`, `world.without`, `world.where`, `world.update`.
- `@miniplex/core` 2.0.0-next.10, a separate newer core package. API: `world.archetype`, `world.addComponent`, `world.setComponent`.
- `@miniplex/react` 2.0.0-next.10, whose peer dependency is `@miniplex/core`, not `miniplex`.

Confirmed decision for Step 3 (user approved 2026-11-07):
- Use `miniplex@2.0.0` only. Import `World` from `'miniplex'`.
- Remove `@miniplex/core` and `@miniplex/react` from `package.json` during Step 3 so no future model is tempted to mix the APIs.
- Do not import `@miniplex/react` or `@miniplex/core` in game code.
- Reason: the game loop needs ECS access outside React for 60fps. The React binding triggers re-renders, is still a pre-release, and its `World` class is a different class from `miniplex`'s `World`.
- The `Entity` interface in `src/types/index.ts` already has `id: string`, which is fine for `miniplex@2.0.0`.

If the user later insists on React bindings, migrate the whole ECS layer to `@miniplex/core` plus `@miniplex/react` together. Never pass a `miniplex` World into `@miniplex/react` hooks.

### 2.4 Camera and world scale

- Fixed orthographic camera at position `[20, 20, 20]`, looking at the origin. This is the classic isometric 45 degree heading and 35.26 degree elevation.
- Default zoom is 40.
- One world unit equals one dungeon tile.
- The preview floor is 20x20 tiles.
- `Canvas` also receives matching orthographic camera props to avoid a first-frame perspective flash.
- `IsometricCamera.tsx` calls `camera.lookAt(0, 0, 0)` in an effect. Do not remove this. A raw Three camera looks down local -Z and will not frame the floor correctly.
- Debug orbit controls are behind `const DEBUG_ORBIT_CONTROLS = false` in `IsometricCamera.tsx`.

### 2.5 Lighting and shadows

- Cool ambient fill: `ambientLight` color `#9db4d6`, intensity 1.1.
- Warm key: `directionalLight` color `#ffb877`, intensity 3.4, position `[12, 18, 8]`, 2048 shadow map.
- Shadow camera covers the 20x20 floor.
- Canvas uses `shadows="percentage"` because Three 0.187 removed `PCFSoftShadowMap`.
- `ReferenceBlock` exists only to prove shadows work and must be removed when real dungeon geometry lands in Step 4.

### 2.6 Post-processing decisions

Pipeline order in `Effects.tsx`:
1. `TiltShift`
2. custom `Dither`
3. `Noise`
4. `Vignette`

Settings:
- TiltShift: `blendFunction NORMAL`, `offset 0`, `rotation 0`, `focusArea 0.35`, `feather 0.5`, `KernelSize.MEDIUM`, `resolutionScale 0.5`.
- Dither: custom effect, `strength 0.03`, `scale 2`.
- Noise: `BlendFunction.OVERLAY`, opacity 0.06, premultiplied.
- Vignette: `offset 0.35`, `darkness 0.5`.
- Composer: `multisampling={4}`.

Important details:
- `Dither` does not exist in the current `postprocessing` package. Do not try to import it. The custom implementation is in `src/components/effects/Dither.ts`.
- The custom dither uses the `resolution` uniform that postprocessing injects into effect shaders.
- The dither has a luminance mask so near-black background pixels do not become a checkerboard. Raising strength to 0.12 previously caused exactly that. Keep it subtle unless the user explicitly asks for a stronger retro look.
- Pass `blendFunction` explicitly for every effect. Some library wrappers use sentinel defaults that can skip an effect entirely.
- `EFFECTS_ENABLED` in `Effects.tsx` is the A/B debug flag.

### 2.7 UI layering

- The Canvas lives in an absolutely positioned layer with `z-index: 0`.
- The DOM UI overlay lives on top with `z-index: 1` and `pointer-events: none`.
- The current badge in `App.tsx` is a temporary placeholder. Real HUD work starts in Step 7.
- Post-processing affects only the canvas, never the DOM overlay.

### 2.8 TypeScript and imports

- `tsconfig.json` is protected and has no `paths` mapping for the `@` alias.
- Vite resolves `@` because of `vite.config.ts`, but `tsc` does not.
- Use relative imports until the user authorizes adding `baseUrl` and `paths` to `tsconfig.json`.
- `src/vite-env.d.ts` exists and references `vite/client`; this is required for SCSS module imports and `import.meta.env` typing.
- `noUnusedLocals` and `noUnusedParameters` are enabled. Remove unused imports and variables immediately.
- Global types belong in `src/types/index.ts`. That file is protected; extend it carefully and do not overwrite it.

### 2.9 Styling

- Use SCSS Modules for UI components: `*.module.scss`.
- `vite.config.ts` injects `_variables.scss` into every SCSS module, so mixins such as `glass-panel` are available without an explicit `@use`.
- Vite 5 emits a Dart Sass legacy JS API deprecation warning. It is not an error. Do not upgrade Vite just to silence it. A future cleanup can set `css.preprocessorOptions.scss.api` to a modern value.
- Do not modify `src/styles/global.scss` or `_variables.scss` without care; they are part of the protected foundation.

### 2.10 Debug flags

- `DEBUG_ORBIT_CONTROLS` in `src/components/scene/IsometricCamera.tsx` toggles OrbitControls.
- `EFFECTS_ENABLED` in `src/components/Effects.tsx` toggles the post-processing pipeline.
- `.env.development` already defines `VITE_DEBUG_PHYSICS=false`; use it for Rapier debug rendering in Step 3 and add its typing to `src/vite-env.d.ts`.

### 2.11 Zustand upgrade (approved 2026-11-07)

- Upgrade the root `zustand` dependency from 4.5.7 to 5.1.0 during Step 3.
- Reason: R3F and Drei already use `zustand@5.1.0` internally. Aligning the root removes a duplicate copy and matches the current API.
- In Zustand 5, shallow helpers live under `zustand/react/shallow`; simple selectors and `create` are unchanged.
- The store must contain only UI and aggregate game values. Never store per-frame positions, rotations, velocities, or health in Zustand.

### 2.12 Physics defaults (approved 2026-11-07)

- Gravity is `[0, -9.81, 0]`.
- The simulation uses a fixed timestep of `1/60` with interpolation enabled.
- The hero will be a grounded capsule with no jumping.
- `Physics` wraps the scene inside the Canvas, not the Canvas itself.
- Use `VITE_DEBUG_PHYSICS` to toggle Rapier debug rendering and add its typing to `src/vite-env.d.ts`.
- A temporary dynamic probe box will verify gravity and collision during Step 3 and must be removed when real dungeon geometry lands.

### 2.13 Approved plan amendments and improvement backlog (2026-11-07)

The user approved the following shifts. Log them as active project direction:

- Step 4 uses instanced floor and wall meshes plus one fixed compound/static collider instead of one rigid body per tile.
- Step 4 precomputes wall cutaways from the fixed camera angle instead of raycasting every frame.
- Step 5 uses the low-level Rapier `world.createCharacterController()` API inside `useBeforePhysicsStep`. There is no `KinematicCharacterController` React component in `@react-three/rapier`.
- Step 6 uses Rapier sensor colliders and a spatial grid/hash for proximity checks instead of O(n^2) scans.
- Add a diorama plinth or floor edge trim.
- Add utility-based autonomous AI goals: explore, loot, engage, retreat.
- Add queued, cached audio and TTS playback with an audio unlock on menu entry.
- The remaining items in section 5 are approved as a prioritized backlog, not mandatory for the current step.

### 2.14 Step 4 tooling additions (approved 2026-11-08)

- Add Drei `<Stats />` (or `<StatsGl />`) behind a debug flag so draw calls and frame time are visible while dungeon complexity grows. Default off; never ship it enabled.
- Add a lightweight DOM toggle for Rapier physics debug rendering, so colliders can be inspected without restarting Vite with `VITE_DEBUG_PHYSICS`. The env var remains the initial default; the toggle overrides it at runtime.
- Both controls belong in the temporary development overlay, not the final HUD. Remove or hide them before any release build.
- Keep debug UI state out of the per-frame game loop. It is a rare UI change and may live in React state or the Zustand store.

### 2.15 Approved Step 4 dungeon design (2026-11-08, micro-step 4.00)

The user approved the following design after the read-only audit. These are implementation requirements unless the user approves a later amendment.

- **Seed:** depth 1 defaults to `1337`. Depth 2 and later use `seedForDepth(depth)` so floors vary. `VITE_DUNGEON_SEED` overrides both. Layouts stay cached by resolved seed.
- **Rooms:** target 5 rooms, minimum 4, maximum 6. The start room is 5 to 7 tiles per side and centered. Other rooms are 3 to 5 tiles per side. Keep one empty tile between rooms. Bounded placement rejects out-of-bounds and overlapping rooms; retry with smaller dimensions if fewer than 4 rooms fit. `rooms[0]` is the designated start room.
- **Corridors:** carve one-tile-wide L-shaped corridors, alternating horizontal-first and vertical-first. Connect each new room to the nearest already-connected room, producing a spanning tree. Add at most one optional loop between non-adjacent rooms. Guarantee connectivity by construction and verify it with a development-only flood fill.
- **Spawn:** `rooms[0].center`, converted with `worldX = cell.x - (size - 1) / 2`, `worldZ = cell.z - (size - 1) / 2`, `worldY = FLOOR_TOP`. The even-sized grid leaves a 0.5-unit origin offset, which is acceptable.
- **Perimeter and cutaway:** create a closed outer ring. `tall` walls are the far edges `x === 0 || z === 0`; `low` walls are the near edges `x === 19 || z === 19` and all interior walls. Use 4-neighbour adjacency for interior wall derivation. Decide heights once during generation; never raycast occluders per frame. Keep colliders at full height even where visuals are low.
- **Wall merging:** greedy 2D rectangles instead of horizontal-only strips. Use merged runs for collision. Use per-tile instancing for wall visuals so tile scale stays consistent.
- **Floor visuals:** one instanced mesh with a shared `1 x FLOOR_TILE_HEIGHT x 1` box, inset by `FLOOR_TILE_INSET`. One matrix per floor cell, built once per seed and cached outside React.
- **Wall visuals:** two instanced meshes, one for tall walls and one for low walls, using fixed-height box geometries.
- **Collision:** one fixed `RigidBody` with `colliders={false}` containing merged floor rectangles with their top at `FLOOR_TOP`, merged wall runs, and one plinth cuboid. This is one body with roughly 20 to 60 cuboid colliders.
- **Plinth:** `20.8 x 0.8 x 20.8`, top at `y = 0`, bottom at `-0.8`, dark stone material, with a contrasting 0.12 to 0.15 unit top-edge trim. Floor tiles sit above it with their top at `FLOOR_TOP = 0.06`.
- **Module layout:** reuse `src/game/dungeon/random.ts` and `constants.ts`; split placement, corridors, walls, and visual/collider derivation into focused modules. Compose from `src/components/dungeon/` components. No new dependencies.
- **Validation:** add a pure `validateLayout(layout)` check for bounds, non-overlap, spawn-on-floor, determinism, and connectivity. Do not add Vitest without approval.
- **Baseline repair:** micro-step 4.01 must restore `FLOOR_THICKNESS` in `src/game/constants.ts` and implement the four missing debug members in `src/game/store.ts`. Do not edit protected `src/types/index.ts`.

### 2.16 Corridor routing amendment (2026-11-08, micro-step 4.04)

The user approved these refinements to the corridor portion of section 2.15:

- Corridors remain one tile wide. The Step 5 hero capsule plus character-controller offset must stay within half a tile; this is documented beside `DUNGEON_CORRIDOR_WIDTH`.
- Routing uses a deterministic bounded breadth-first search. Every room other than the current source and destination is blocked together with its one-tile buffer, so corridors cannot pass through or run alongside an unrelated room.
- The spanning tree remains the guaranteed connection strategy. One optional loop is added between the longest non-tree room pair that has a valid route.
- Walkable floor cells are merged once into a unique row-major array, and a four-direction flood fill asserts full connectivity.
- Pure verification lives in `scripts/verify-dungeon.mjs`. It compiles the dungeon modules with the installed TypeScript package into the OS temp directory and runs a 500-seed deterministic check without adding a dependency or modifying protected manifests.
- `VITE_DUNGEON_SEED` is declared in `src/vite-env.d.ts`; protected `.env.development` remains unchanged, so a shell environment value is used for an explicit override.

### 2.17 Wall generation amendment (2026-11-08, micro-step 4.05)

The user approved these refinements to the wall portion of section 2.15:

- The 4.00 closed outer ring wins over a literal exposed-edges-only reading. Walls are placed on exposed orthogonal floor edges and on the full outer ring so the diorama silhouette always closes.
- Cutaway heights: tall (`2.2`) on the far edges `x === 0 || z === 0`; low on near edges and all interior walls. Low height was lowered from `0.75` to `0.6` to improve future hero visibility.
- Wall cells merge into greedy two-dimensional axis-aligned rectangles per height. Each wall cell is covered by exactly one run, which removes the earlier horizontal-only limitation and keeps colliders gap-free.
- Room placement now chooses a deterministic per-seed target in the approved 4 to 6 range instead of always targeting 5. The minimum-4 fallback and bounded attempts are unchanged.
- The verifier additionally checks exposed floor edges, the outer ring, wall/floor overlap, far-edge height classification, run bounds, and exact run coverage.

---

## 3. Environment and Commands

- Platform: Windows, PowerShell.
- Node 20.19.0, npm 11.21.2.
- Git repository initialized on branch `main`.
- Initial commits:
  - `25a4fbe chore: initial commit with foundational architecture`
  - `239dc7c feat: scaffold app and isometric base scene`

Useful commands:
```powershell
npm install
npm run dev
npx tsc -b --pretty false
npm run lint
npm run build
git status --short
```

Known non-blocking warnings:
- `THREE.Clock: This module has been deprecated` comes from R3F 9 internals.
- Dart Sass legacy JS API deprecation comes from Vite 5.
- Vite production build warns that the main JS chunk is over 500 kB. This is expected while Three is bundled; address only if load time becomes a requirement.
- Rapier logs "using deprecated parameters for the initialization function; pass a single object instead". It originates inside `@react-three/rapier` 2.2.0, not project code. Ignore it; do not patch `node_modules`.

---

## 4. Step-by-Step Plan Review

Status: reviewed and approved by the user on 2026-11-07. The amendments below are now the active plan.

### Step 3 - ECS and physics

Plan intent is correct, but it needs two clarifications.

1. **Miniplex:** use `miniplex@2.0.0` only, as described in section 2.3. Create `src/game/ecs.ts` with a module-level `World<Entity>`, typed entity factories, and archetype queries. Do not use React state or `@miniplex/react` for entity data.
2. **Rapier:** `@react-three/rapier` 2.2.0 is compatible with React 19 and fiber 9. Wrap the scene in `<Physics>` inside the Canvas, not around the Canvas. Use `timeStep={1/60}`, `interpolate`, `gravity={[0, -9.81, 0]}`, and `debug={VITE_DEBUG_PHYSICS === 'true'}`.
3. **Zustand:** create `src/game/store.ts` implementing `GameState` from `src/types/index.ts`. Store only UI and aggregate game values. Never store per-frame positions, rotations, or health in React state, and do not put rapidly changing spatial data in Zustand either.
4. **Verification:** add a temporary dynamic test box above a static floor to prove gravity and collisions, then remove it. Do not start Step 4 until this works and the browser is verified.

### Step 4 - Dungeon generation

Main risk: draw calls and rigid body count.

- Do not create a separate `RigidBody` for every floor tile. Use instanced meshes for visuals and one fixed rigid body with many cuboid colliders, static colliders, or a trimesh/heightfield for collision.
- Merge or instance wall and floor geometry. A 20x20 room with individual meshes will waste draw calls.
- Wall cutaway: the camera is fixed, so precompute which walls occlude the view. Hide or fade those few walls; do not raycast every frame. Keep colliders active.
- Avoid many transparent walls; transparency causes sorting and overdraw. Prefer cutaway geometry or opacity on only the occluding walls.
- Seed procedural generation so bugs are reproducible.

### Step 5 - Hero, torch, and AI

- `@react-three/rapier` does not export a `KinematicCharacterController` component. Use `useRapier().world.createCharacterController(offset)` and drive it with `computeColliderMovement` inside `useBeforePhysicsStep`. Apply `computedMovement()` to a kinematic-position rigid body. This still uses Rapier; do not write custom collision math.
- A shadow-casting point light is expensive because it renders six shadow faces. Prefer a spotlight with one shadow map, or a point light without shadows plus an emissive flame. If a point light must cast shadows, use a small map and limit casters.
- Throttle autonomous pathfinding. Replan at 4-10 Hz, not every frame. Cache waypoints and vectors outside React. Use stuck detection and a fallback waypoint.
- Manual WASD override and the 4-second idle return should live in a hook that mutates refs/ECS state, not React state.

### Step 6 - Monsters and combat

- Use Miniplex archetype queries for monster lists, but avoid O(n^2) distance checks at scale. A simple grid bucket or spatial hash is enough for this game.
- Use Rapier sensor colliders and intersection events for sword hit tests rather than hand-rolled raycasts.
- Pool monster entities and recycle meshes when they die.
- Add attack wind-up/telegraph, cooldown, hit flash, knockback, and brief invulnerability frames for readable combat.

### Step 7 - UI and View Transitions

- TypeScript 5.9.3 is installed and includes `Document.startViewTransition` and `ViewTransition` types, so no shim is needed.
- Wrap the state update that changes screens in `flushSync` inside `document.startViewTransition` so React commits the DOM before the transition snapshot.
- Keep UI state in a Zustand store or a small React state machine. React `useState` is acceptable for menu state, but not for fast game data.
- Use SCSS Modules, container queries, native popovers, and `@starting-style` as planned. Add a reduced-motion fallback for view transitions.

### Step 8 - Audio and TTS

- Browsers block autoplay until a user gesture. Add a Main Menu "Enter Dungeon" click that unlocks Howler and the audio context. A self-playing game will otherwise be silent.
- TTS fetch calls need an `AbortController`, timeout handling, and a queue so overlapping lore lines do not talk over each other.
- Cache returned audio blobs if the local XTTS server is slow, and fail silently if the server is offline.
- Duck sound effects while a Deckard Cain line plays.

### Cross-cutting additions

- Add a performance budget: target 60fps at 1080p, cap DPR at 1.5 on mid-range GPUs, and keep draw calls low through instancing.
- Add Drei `<Stats />` or `<StatsGl />` behind a debug flag for profiling.
- Consider Vitest for pure logic tests (dungeon connectivity, pathfinding, ECS systems). It is not installed yet; adding it requires package approval.
- Verify every step with `tsc`, lint, production build, and a browser check before committing.

---

## 5. Proactive Improvement Backlog

Status: approved by the user on 2026-11-07 as a prioritized backlog. Implement items in the order that supports the current step; do not let backlog work block step completion.

Ordered roughly by impact on the final product.

### Performance

- Instance dungeon floor and wall meshes; keep static geometry in one or few draw calls.
- Use one fixed compound collider for static level geometry instead of per-tile rigid bodies.
- Limit shadow casters. Prefer one directional shadow map plus one spotlight torch shadow. Use blob/contact shadows for monsters.
- Cap DPR and composer multisampling on lower-end hardware. TiltShift already runs at half resolution; keep it there.
- Pool monsters, damage flashes, and particles. Avoid per-frame allocations in `useFrame`.
- Throttle AI, pathfinding, and spatial queries to fixed intervals.
- Keep all mutable spatial data in refs/ECS, never React state.

### Graphics

- Build a diorama plinth or floor edge trim so the level reads as a miniature object.
- Add warm emissive torches with subtle intensity flicker and a few floating dust particles.
- Use selective bloom only if torches exist; full-scene bloom is often too expensive and washes out the palette.
- Add a subtle contact shadow or dark decal under the hero and monsters.
- Fade only the occluding walls; keep the cutaway readable and stable.
- Consider a very slow camera drift or combat zoom pulse, but keep the fixed isometric readability as the default.

### Gameplay

- Use utility-based AI goal selection: explore unknown rooms, collect loot, engage weak enemies, retreat at low health.
- Add combat telegraphs, hit stop, knockback, and damage numbers or hit flashes.
- Add multiple monster archetypes with different aggro ranges and movement speeds.
- Add seeded dungeon generation, stairs, chests, traps, and a clear depth progression.
- Add a debug panel to seed levels, spawn monsters, toggle AI, and inspect ECS state.

### UI and audio

- Show health hearts and gold with container-query scaling.
- Use native popovers for lore and item tooltips.
- Unlock audio on menu entry and queue TTS lines.
- Add a reduced-motion setting and a pause/mute toggle.

### Testing and quality

- Add Vitest for dungeon connectivity, pathfinding, and ECS system tests.
- Add a deterministic seed input for bug reports.
- Add a simple FPS/draw-call overlay during development.
- Keep every component under 200 lines and every game-logic hook outside render components.

---

## 6. Next Immediate Task

**Finish Step 3, then start Step 4 only after approval.**

Step 3 is code-complete and headless-verified. The only remaining work is:

1. Ask the user to run `$env:VITE_DEBUG_PHYSICS='true'; npm run dev` and confirm:
   - The orange probe box falls from above and comes to rest on the floor.
   - Pink Rapier debug wireframes are visible around the box and the floor slab.
   - The badge shows "Step 3 - ECS and Physics" and "Depth 1".
   - No console errors beyond the known deprecation warnings.
2. If approved, confirm `EFFECTS_ENABLED` is `true`, then commit with `feat: add ECS foundation and Rapier physics`.
3. Ask permission before starting Step 4.

**Step 4: Dungeon Generation.** Approved approach:

- Seeded procedural generation with a documented seed source.
- Instanced floor and wall visuals, not one mesh per tile.
- One fixed compound/static collider for level geometry, not one rigid body per tile.
- Precomputed wall cutaways from the fixed isometric camera angle; never raycast occluders every frame.
- Delete `PhysicsProbe.tsx` and `ReferenceBlock.tsx` when real geometry replaces them.
- Add the approved diorama plinth / floor edge trim here, since it defines the miniature silhouette.
- Keep the step browser-verifiable and update this file before committing.

Do not start Step 5 until the user approves Step 4.

#### Correction (2026-11-08, micro-step 4.00)

The instruction above to finish Step 3 first is stale. Step 3 was approved on 2026-11-08, but commit `c133a6c` later broke the baseline by removing `FLOOR_THICKNESS` and adding unimplemented `GameState` debug members. Do not redo Step 3 and do not ask for the old Step 3 browser verification again.

The next immediate task is micro-step 4.01: repair those two compile failures. Then continue with 4.02 through 4.12 using the approved design recorded in section 2.15. The committed `src/game/dungeon/` generator is an input to 4.02 through 4.05, not approved final behavior.

---

## 7. Handoff Protocol

Follow the critical interaction loop from `.cursorrules` for every task:

1. Read and ask clarifying questions. Wait for answers before writing code.
2. Write the focused component, hook, or configuration.
3. Instruct the user how to verify in the browser. Ask if it works and whether they are satisfied.
4. Update this `AI_HANDOFF.md` file immediately before the commit.
5. Execute the Git commit and report the hash.
6. Ask permission before starting the next step.

Keep this document accurate. If a decision changes, append a dated entry to section 2 rather than deleting the old reasoning. The next model should be able to continue from this file without reading the entire chat history.

#### Correction (2026-11-08, micro-step 4.00)

For the micro-step workflow, `docs/steps/INDEX.md` governs the interaction loop: ask only when a decision genuinely blocks safe implementation, and wait for explicit approval after each micro-step. The older five-stage loop above still describes commit and handoff mechanics, but its ask-before-every-coding-task rule is superseded by the prompt pack. Preserve this historical text.

---

## 8. Micro-Step Execution Log

- **2026-11-08 — 4.00 Read-only baseline audit and dungeon design proposal:** Audit completed at HEAD `417fe2a` with no source changes. Confirmed `tsc -b` and `build` fail on missing `FLOOR_THICKNESS` and unimplemented `GameState` debug members; lint passes. Confirmed commit `c133a6c` introduced both failures and added an unapproved early dungeon generator. User approved the dungeon design recorded in section 2.15. Next task is 4.01; Step 4 is not complete.
- **2026-11-08 — 4.01 Repair confirmed Step 3 baseline inconsistencies:** Restored `FLOOR_THICKNESS = 0.5` in `src/game/constants.ts` and implemented the four missing `GameState` debug members in `src/game/store.ts`, with `physicsDebug` initialized from `VITE_DEBUG_PHYSICS` and defaulting false. Protected files untouched. `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` all pass; `git diff --check` clean. UI wiring remains deferred to 4.10. Next task is 4.02.
- **2026-11-08 — 4.02 Dungeon configuration, deterministic seed, and PRNG:** Centralized the approved design in `src/game/dungeon/constants.ts`: `DUNGEON_SIZE` derives from `FLOOR_SIZE`, default seed `1337`, room target 5 with bounds 4 to 6, start room 5 to 7, later rooms 3 to 5, one-tile spacing and corridors, wall heights, and plinth dimensions. Extended the documented Mulberry32 helper with typed `chance` and `pick` helpers; `seedForDepth(1)` now returns 1337 and deeper floors keep the hash. A temporary external harness confirmed identical sequences for identical seeds, differing sequences for different seeds, integer bounds, and distribution. TypeScript, lint, and production build pass. Next task is 4.03.
- **2026-11-08 — 4.03 Bounded, non-overlapping room placement:** Added pure `src/game/dungeon/rooms.ts` with a centered 5 to 7 tile start room and 3 to 5 tile later rooms, one-tile spacing, margin and bounds checks, 100-attempt cap, deterministic ordering, populated centers, and an explicit success/failure result. `generateDungeon` now consumes this placement and throws a seed-specific error on failure instead of returning a partial layout. A temporary external harness over 500 seeds found zero failures, always 5 rooms, no bounds or spacing violations, and identical room arrays for identical seeds. TypeScript, lint, and production build pass. Corridor and wall logic is unchanged and remains for 4.04 and 4.05. Next task is 4.04.
- **2026-11-08 — 4.04 Corridor carving and guaranteed connectivity:** Added `corridors.ts`, `pathfinding.ts`, and `connectivity.ts`. Corridors are one tile wide and routed by deterministic breadth-first search that blocks unrelated rooms and their one-tile buffers. A nearest-room spanning tree guarantees connectivity, followed by at most one optional loop between the longest routable non-tree pair. Floor cells are merged once in stable row-major order and checked with a four-direction flood fill; generation throws if the floor is disconnected. Added `scripts/verify-dungeon.mjs`, which compiles the pure modules to the OS temp directory and verifies 500 seeds without new dependencies. Also declared `VITE_DUNGEON_SEED` in `src/vite-env.d.ts`. All 500 seeds passed with one loop each; TypeScript, lint, and production build pass. Wall generation remains for 4.05. Next task is 4.05.
- **2026-11-08 — 4.05 Perimeter walls, cutaways, and merged runs:** Added `walls.ts`. Walls cover exposed orthogonal floor edges plus a closed outer ring; far edges `x === 0 || z === 0` stay tall and near/interior walls are low. Low height dropped from `0.75` to `0.6` for future hero visibility. Wall cells merge into greedy 2D rectangles per height with exact single coverage, replacing the old 8-neighbour and horizontal-only logic. Room placement now varies its target across the approved 4 to 6 range. The verifier checks exposed edges, the outer ring, wall/floor overlap, height classification, run bounds, and exact run coverage. All 500 seeds pass: room counts 4/5/6, wall runs 18 to 40, one loop each; TypeScript, lint, and production build pass. Walls are data only; instancing and colliders remain for 4.06 to 4.08. Next task is 4.06.
