# Dungeon Dude - AI Handoff

Last updated: 2026-11-10
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

#### Step 6 completion status (2026-11-11, micro-step 06-09)

Step 6 (Monsters and Combat) is code-complete, user-approved on 2026-11-11, and committed. Micro-steps 6.01 through 6.09 are ticked in `docs/steps/INDEX.md`. The next major step is Step 7 (UI and View Transitions), starting with micro-step 7.01.

- Combat pipeline: `SwordSensor` queues hits from a Rapier ball sensor; `CombatSystem` resolves damage, knockback, damage numbers, monster strikes, and hero i-frames through pure modules in `src/game/combat/`.
- Death events leave the queue in `src/game/combat/deathEvents.ts` for Step 6 follow-up removal work; dead monsters stop moving, attacking, and rendering feedback but are not yet pooled or removed from the ECS.
- Hero death is deliberately disabled (`HERO_DEATH_ENABLED = false`) until Step 7's Game Over flow; the hero clamps at 1 health.
- `src/game/monsters/step6Scenario.test.ts` is the reproducible acceptance scenario (fixed seed 42, depth 1) covering spawns, index, aggro/navigation, one-hit-per-swing, damage/death, monster strikes, i-frames, and knockback.
- Verification at acceptance: `npx tsc -b --pretty false`, `npm run lint`, `npm test` (35 files / 170 tests), `npm run build`, and `git diff --check` all pass. Browser checks were confirmed by the user.

The Step 3 block below is preserved as historical context.

- **Current step:** Step 3 (ECS Architecture and Physics Setup) is implemented, browser-verified, and approved by the user on 2026-11-08.
- **Last committed step:** Step 2, commit `c4a6b44 feat: add miniature diorama post-processing pipeline`.
- **Step 3 commit status:** Committed together with this handoff document under `feat: add ECS foundation and Rapier physics`.
- **Expected dirty files for the Step 3 commit:** `package.json`, `package-lock.json`, `src/App.tsx`, `src/App.module.scss`, `src/components/scene/Floor.tsx`, `src/vite-env.d.ts`, `src/game/constants.ts`, `src/game/ecs.ts`, `src/game/store.ts`, `src/components/physics/GamePhysics.tsx`, `src/components/physics/FloorCollider.tsx`, `src/components/physics/PhysicsProbe.tsx`, and this file.

#### Step 5 completion status (2026-11-11, micro-step 05-14)

Step 5 is code-complete and all automated verification passes. Browser soak acceptance (10 minutes on seeds 1 and 42, 5 minutes on a chosen seed) remains for the user; `INDEX.md` 5.14 and the Step 5 header are ticked only after that approval.

**File map**

- `src/components/hero/Hero.tsx` — composes entity, rig, animation, brain, and Rapier body/collider/movement. `HeroModel.tsx`, `HeroTorch.tsx`, and `useTorchFlicker.ts` own the visual model and the single shadow-casting torch spotlight.
- `src/hooks/hero/` — `useHeroEntity` (one ECS hero), `useHeroRig` (unconditional refs), `useHeroAnimation` (walk cycle), `useHeroMovement` (character controller plus snap recovery), `useHeroBrain` (5 Hz tree clock and manual gating).
- `src/game/hero/constants.ts` — every Step 5 tuning value.
- `src/game/hero/input/` — `keyTracker`, `gamepad`, `manualControl`, `inputState`; `src/components/hero/InputBridge.tsx` attaches the native listeners.
- `src/game/hero/intent.ts`, `isoMovement.ts` — manual/auto arbitration and camera-relative axes.
- `src/game/hero/navigation/` — `walkGrid`, `heroPath`, `smoothPath`, `route`, `routeState` (module singleton route).
- `src/game/hero/ai/` — `exploreGoals`, `stuckDetector`, `heroBrain` (Mistreevous MDSL tree).
- `src/components/debug/` — `DebugOverlay`, `DungeonStats`, `HeroDebugReadout`, `PathDebug`; all are `import.meta.env.DEV` gated and absent from production builds.
- Tests: `exploreSim.test.ts` (headless 50-seed exploration), plus navigation, input, intent, brain-support, and Mistreevous semantics suites.

**Verified**

- `npx tsc -b --pretty false`, `npm run lint`, `npm test` (83/83), `npm run build`, `node scripts/verify-dungeon.mjs` (500/500 seeds), and `git diff --check` all pass.
- `exploreSim.test.ts` simulates a point mass at `HERO_SPEED` in 60 Hz steps for seeds 1 to 50 using the same pure planning modules as the brain. Every room is visited within 60 simulated seconds per room, every step is on a walkable cell, and no reachable room route is null.
- Production preview serves without debug UI; the built JS contains no debug-overlay strings.
- `howler` and `@types/howler` were unused and were removed from `package.json`.

**Tuning constants**

- Capsule radius `0.28`, height `1.05`, ground clearance `0.02`, controller offset `0.02`, speed `3.0` world units per second.
- `HERO_WAYPOINT_REACH = 0.12`, `HERO_PATH_CLEARANCE = 0.32`, `HERO_BRAIN_HZ = 5`, `HERO_IDLE_RETURN_MS = 4000`.
- Stuck detection: `HERO_STUCK_WINDOW_MS = 1000`, `HERO_STUCK_MIN_PROGRESS = 0.3`, recovery levels 0 to 3 (replan, new goal, snap to cell).
- Camera zoom `64`; the fixed isometric camera does not follow or lead per user feedback.
- Torch: one shadow-casting spotlight (512 map), one no-shadow warm point light.

**Known limitations**

- The hero does not attack; `Space` is recorded only as `inputState.attack` for Step 6.
- No doors, keys, or stairs in the new Step 5 path. The old POI tree (`src/game/ai/HeroTree.ts`), `src/game/pathfinding.ts`, and `tests/herotree.test.ts` remain from the superseded implementation and are not used by the new brain.
- Stuck recovery snaps to the current cell center only at level 3; a monster or dynamic obstacle is not yet considered.

**Decisions made along the way**

- The `docs/steps/05-01-hero-and-ai/` series supersedes the older `05-hero-and-ai` implementation; the rebuild was intentional.
- Input uses native listeners plus a module singleton instead of Drei `KeyboardControls`, so held keys clear on blur.
- The torch spotlight is the only shadow caster.
- `useHeroRig` uses one unconditional `useRef` plus `createRef`; React Compiler must not memoize an object literal of hooks.
- The brain credits a completed room in both `TrackRoute` (empty route) and `PlanNext` (short-route safety), and `useHeroBrain` clears the shared route on mount/unmount so floors cannot leak routes.
- The 5.10 "Route to random room" step is implemented as click-to-route on an invisible floor plane.

**Step 6 pointers**

- Add combat/loot/descent branches as siblings in the `HERO_TREE` MDSL const in `src/game/hero/ai/heroBrain.ts`.
- Combat reads hero position, heading, and velocity from `heroQuery.first`.
- `Space` maps to `inputState.attack`.

#### Step 5 completion status (2026-11-10, superseded)

Step 5 is code-complete for the AI visualization and seed hardening micro-steps. Browser acceptance for the remaining Step 5 polish items is still pending. This entry describes the earlier `05-hero-and-ai` implementation and is preserved as history; the 2026-11-11 block above is authoritative.

- Added real-time AI intent visualization using Drei Html for state labeling and Drei Line for path debugging.
- Implemented complete pathfinding module with graph validation, seed resilience, and comprehensive Vitest integration coverage.
- `blackboard.activeState` reports `Idle`, `Wandering`, `Seeking Key`, `Seeking Stairs`, `Key Acquired`, `Descending`, and `Recovering`.
- The debug path is converted from grid space to world space and drawn at floor height.
- Autonomous exploration caps path requests at 4 Hz, avoids current-cell wander targets, and recovers from wall stalls with a deterministic fallback goal.

#### Step 4 completion status (2026-11-09)

Step 4 is complete and was approved by the user on 2026-11-09. The user committed the approved changes as `b3ce0b5` (dungeon generation and rendering). Micro-steps 4.06 through 4.12 are ticked in `docs/steps/INDEX.md`.

Implemented and approved:
- Instanced floor and wall renderers, one fixed compound static Rapier body, diorama plinth and trim, development-only Stats and physics-debug controls, and full App integration.
- Temporary `Floor`, `FloorCollider`, `PhysicsProbe`, and `ReferenceBlock` components were deleted; the real dungeon replaced them.
- The verifier covers 500 seeds including floor matrices, wall matrices, merged floor collider coverage, full-height wall colliders, plinth collider, spawn, determinism, connectivity, and wall runs.

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

### 2.18 Step 4 rendering, collision, plinth, and development tooling decisions (2026-11-09)

The user approved implementing 4.06 through 4.12 end-to-end in one pass and keeping the existing staged 4.06 work. The following decisions are now active:

- **Shared rectangle merge:** `src/game/dungeon/rectangles.ts` owns deterministic greedy two-dimensional rectangle merging. Walls use it for merged runs and the floor collider uses it for merged floor rectangles. Each cell belongs to exactly one rectangle.
- **Shared grid transform:** `gridToWorld(coordinate, size)` in `src/game/dungeon/constants.ts` is the only zero-indexed-cell to world-space transform. Spawn, floor matrices, wall matrices, and colliders all use it.
- **4.06 floor rendering:** `DungeonFloor` uses one `InstancedMesh` with a unit-footprint box and per-instance inset scale. Matrix caches are keyed by `${seed}:${size}`. Floor tops sit at `FLOOR_TOP`.
- **4.07 wall rendering:** `DungeonWalls` uses two `InstancedMesh` batches, one per cutaway height. Geometry owns the fixed wall height, so instance transforms stay per-tile and do not stretch across merged runs. Tall height is `2.2`; low height is `0.6`.
- **4.08 collision:** `DungeonCollider` is exactly one fixed `<RigidBody colliders={false}>` containing merged floor cuboids, one cuboid per merged wall run, and one plinth cuboid. Floor collider tops sit at `FLOOR_TOP`; floor thickness is `FLOOR_COLLIDER_THICKNESS`.
- **Low wall collision:** the user confirmed low visual ledges keep full-height (`2.2`) colliders. The cutaway exists for camera visibility, not for walkable shortcuts.
- **4.09 plinth:** one `20.8 x 0.8 x 20.8` dark stone block with its top at `y = 0` and four thin `0.15` contrasting rails slightly proud of the sides. Rails are used instead of a full top slab so the plinth top stays dark and the walkable floor remains the brightest surface. The plinth does not cast a shadow; its large top face in the shadow map can cause acne on the thin floor plates. The floor material was also lightened to `#3c4a60` so corridors read clearly from the fixed camera.
- **4.10 development tools:** `DebugOverlay` is a development-only DOM panel bottom-right showing depth, seed, rooms, floor cells, and wall runs. It toggles `StatsGl` (off by default) and runtime Rapier debug rendering. `GamePhysics` reads `physicsDebug` from Zustand, whose initial value still comes from `VITE_DEBUG_PHYSICS`, so toggling does not require a Vite restart. Production builds render no debug controls.
- **4.11 composition:** `src/components/dungeon/Dungeon.tsx` composes the plinth, floor, walls, and collider from one immutable `DungeonLayout`. `App.tsx` mounts only the dungeon inside `GamePhysics`; the preview floor, duplicate collider, reference block, and physics probe are deleted.
- **4.12 verification:** `scripts/verify-dungeon.mjs` now also proves floor instance matrices, wall instance matrices, exact merged floor collider coverage, full-height wall colliders, plinth collider dimensions, and spawn placement across 500 seeds.
- **Draw-call budget:** the dungeon visuals use eight draw calls (floor, tall walls, low walls, plinth, four trim rails). Static collision is one rigid body with merged cuboids and no per-tile rigid bodies. The four trim rails could become one instanced batch later if needed.
- **Known wording conflict:** 4.08 acceptance says the hero surface is at `y = 0`, while 2.15 and the spawn code use `FLOOR_TOP = 0.06`. `FLOOR_TOP` is authoritative for the walkable surface; y=0 is treated as the nominal ground plane.

### 2.19 Mistreevous API decisions for the hero wander tree (2026-11-10, micro-step 05-03-01)

- The package exports `BehaviourTree` (British spelling); the step contract's `BehaviorTree` import is aliased (`BehaviourTree as BehaviorTree`) so the contract's API name is preserved.
- Mistreevous action leaves throw at runtime for any return value other than `State.SUCCEEDED`, `State.FAILED`, `State.RUNNING`, or `undefined`, even though the TS type `AgentFunction` claims `boolean`. The contract's boolean returns were mapped to `State.SUCCEEDED`/`State.FAILED`.
- The blackboard is the Mistreevous "agent": leaf functions are looked up by property name on it and invoked with `this` bound to it. `position` and `outputDirection` are world space; `currentPath` and the nav graph are grid space. Crossings use `gridToWorld` and its inverse `world + (DUNGEON_SIZE - 1) / 2`. The contract's original code mixed the two spaces, which would have made `findPath` return `[]` every frame.
- `Hero` derives the layout from the cached `getDungeonLayout(currentDepth)` and memoizes `navGraph` and the tree, so no `App.tsx` prop change was needed and a depth change rebuilds the tree.
- Mistreevous `condition` leaves also require functions: the contract's `hasKey: false` data field cannot be referenced as `condition [ hasKey ]` (the library throws "function is not defined on the agent"). The raw state lives in `hasKeyState`, and `hasKey` is the condition leaf function.
- User-approved deviation from the contract's reference tree (2026-11-10, micro-step 05-05-01): `interact` moved from after `moveAlongPath` to the front of the key/stairs sequences, acting as an always-succeeding side-effect gate. In the contract's placement the pickup only ran on the re-pathing frame after arrival, coupling it to an extra A* search and a one-frame delay.
- POI selection is nearest-active-by-squared-grid-distance, not first-match in entity order (2026-11-10, post-05-05-01 hardening): the blackboard's `nearestActivePoi` scans the live POI query once per lookup, and ties break by entity order, which is stable for a given spawn order. This keeps the tree correct when Step 6 spawns multiple keys or loot.
- Wander uses the project's seeded Mulberry32 (`createRandom`) instead of `Math.random()`, so auto-pilot is reproducible per depth. `createHeroTree` takes an optional fourth `seed` parameter (default `DUNGEON_DEFAULT_SEED`); `Hero.tsx` passes `layout.seed`, so the same floor always wanders the same way.
- The store is the canonical key state: `GameState` gains `hasKey`/`setHasKey`, set on pickup alongside the blackboard's `hasKeyState`, and `descendToNextLevel` resets it (the key is consumed by the descent, matching the tree rebuild). The blackboard copy still drives the tree; the store copy serves the HUD and future systems.

### 2.20 Step 5 decisions (2026-11-09)

- Physics: Rapier low-level `world.createCharacterController(offset)` driven from `useBeforePhysicsStep`; there is no React controller component in `@react-three/rapier` 2.2.0.
- Pathfinding: reuse the existing deterministic BFS `findGridPath` in `src/game/dungeon/pathfinding.ts`; do not add `ngraph.path`.
- Decision layer: `mistreevous` 4.3.1 behavior tree, stepped at 5 Hz, with a seeded `random`.
- Torch light: one shadow-casting `SpotLight` (one shadow map) plus one no-shadow warm `PointLight`.
- Input: small native key tracker plus native Gamepad poll; Drei `KeyboardControls` cannot clear held keys on window blur.
- Smoothing: `maath` 0.10.8 `easing.damp3` / `easing.dampAngle` for frame-rate-independent smoothing.
- Tests: `vitest@^3.2.7` devDependency, node environment, pure modules only; Vite 5 pins Vitest 3.
- ECS: stay on `miniplex@2.0.0`.
- Corridors are one tile wide, so the hero uses radius 0.28 and controller offset 0.02.
- Idle return is 4000 ms and lives only in `HERO_IDLE_RETURN_MS`.
- Zustand is written only on mode flips.

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

- Add Vitest for dungeon connectivity, pathfinding, and ECS system tests. (Progress: pathfinding graph tests in `tests/pathfinding.test.ts`; hero objective tree tests in `tests/herotree.test.ts`.)
- Add a deterministic seed input for bug reports.
- Add a simple FPS/draw-call overlay during development.
- Keep every component under 200 lines and every game-logic hook outside render components.

---

## 6. Next Immediate Task

#### Status update (2026-11-11, micro-step 07-02)

Micro-step 7.02 (View Transitions helper and reduced-motion fallback) is approved. `src/game/ui/screenTransition.ts` is ready for the screens to call. Next task is micro-step 7.03 (Main Menu and Enter Dungeon start flow), which will wire the screen store into `App.tsx`, conditionally mount the game scene while Playing, and use `commitScreenEvent('startGame')` from the menu button. Do not start 7.04 until 7.03 is approved.

#### Status update (2026-11-11, micro-step 07-01)

Step 7 is active. Micro-step 7.01 (screen-state model and transition boundaries) is approved: `src/game/ui/screenState.ts` owns the three-state union and explicit transition table, and `src/game/ui/screenStore.ts` is the local infrequent UI store. Next task is micro-step 7.02 (View Transitions helper with reduced-motion fallback), then 7.03 (Main Menu). Do not start 7.03 until 7.02 is approved.

#### Status update (2026-11-11, micro-step 06-09)

Step 6 is approved and complete. Start Step 7 with micro-step 7.01 (screen-state model and transition boundaries), one micro-step at a time. Do not begin 7.02 or later until the user approves 7.01. The historical Step 5 status below is preserved unchanged.

#### Status update (2026-11-11, micro-step 05-14)

Step 5 is code-complete and automated acceptance passes: TypeScript, lint, 83/83 tests, production build, the 500-seed dungeon verifier, and whitespace checks. The headless 50-seed exploration simulation is permanent at `src/game/hero/ai/exploreSim.test.ts`. Only the browser soak remains: 10 minutes on seeds 1 and 42, 5 minutes on a chosen seed, with the path overlay on, plus takeover (keys and gamepad if available), alt-tab while holding a key, and a window resize. Do not tick 5.14 or the Step 5 header, and do not start Step 6, until the user approves that soak.

#### Status update (2026-11-09)

Step 4 is approved, committed as `b3ce0b5`, and complete. Step 5 (Hero and Autonomous AI) is active, one micro-step at a time. Micro-step 5.01 (hero visual model) was approved by the user, including the feedback revision that added the sword and sharpened the tilt-shift focus; its INDEX row is ticked. Micro-step 5.02 (torch visuals and efficient lighting) is implemented and awaiting browser approval; do not tick its INDEX row or start 5.03 until that approval. Do not start Step 6 until Step 5 is approved as a whole. The historical Step 3 and Step 4 instructions below are preserved unchanged.

#### Status update (2026-11-10, micro-step 05-05-01)

`src/game/ai/HeroTree.ts` now implements the POI objective tree. `createHeroTree` takes an optional third `world` parameter (defaults to the shared ECS world, so `Hero.tsx` is unchanged), and the POI query `world.with('poiType', 'position', 'isActive')` is created once per tree as a live view. `findKey`/`findStairs` path to active POIs through `acquirePathTo` (world to grid via `worldToGrid`, `.x`/`.z` access), and the always-succeeding `interact` gate at the front of the key/stairs sequences picks up the key (`hasKeyState = true`, key POI deactivated) and, on reaching the stairs while holding the key, deactivates the stairs POI and calls `useGameStore.getState().descendToNextLevel()`, which rebuilds the tree through `Hero`'s depth memo. `Entity` gains `poiType` and `isActive`. POI spawning itself remains Step 6. Next task: the remaining Step 5 micro-steps per `docs/steps/INDEX.md`.

#### Status update (2026-11-10, post-05-05-01 hardening)

User-approved hardening of the hero tree: (1) permanent `tests/herotree.test.ts` (6 tests: no-POI wander, same-seed wander determinism, key pickup with store mirror, nearest-key selection, nearest-stairs selection, full walk-to-key-then-descend flow) over a real `miniplex` world, the real store, and the real nav graph — this replaces the temporary harness from 05-05-01; (2) `GameState` gains `hasKey`/`setHasKey` and `descendToNextLevel` resets it, so the HUD and future systems read key state from the store; (3) POI selection is nearest-active-by-squared-grid-distance (`nearestActivePoi`), not first entity match, so multiple keys/loot in Step 6 resolve correctly; (4) wander is seeded (`createRandom`, fourth `createHeroTree` parameter, `Hero.tsx` passes `layout.seed`), replacing `Math.random()`. `npx vitest run` passes 11/11; `npx tsc -b --pretty false`, `npm run lint` (one pre-existing warning), and `npm run build` pass. Open Step 6 design questions (unchanged, deliberately not implemented here): stairs are key-gated (a keyless floor would trap the hero — Step 6 must guarantee a key or make stairs keyless), and descent consumes the key implicitly (the tree rebuild resets `hasKeyState`; the store reset in `descendToNextLevel` now mirrors that).

#### Status update (2026-11-10, micro-step 05-06-01)

Step 5 physics upgrade complete: Upgraded Hero physics to use Rapier's Kinematic Character Controller for safe wall-sliding and added procedural squash-and-stretch walk cycle animations. `src/components/hero/Hero.tsx` (the step doc's stale `src/game/Hero.tsx` path) now creates one `KinematicCharacterController` in a `useMemo` keyed on the `useRapier()` world (`createCharacterController(0.05)`, then an explicit `disableAutostep()` so the hero cannot climb the diorama walls) and disposes it via `world.removeCharacterController` in a `useEffect` cleanup. Per-frame movement now flows through `body.collider(0)` → `computeColliderMovement(collider, move)` → `computedMovement()` → `setNextKinematicTranslation`, so the hero slides along wall colliders instead of clipping. The walk cycle additionally squashes and stretches the visual group on the same shared phase as the bob, `sin(elapsedTime * 10)` (X/Z 0.05, Y 0.1), so the stretch tracks the rise and the squash tracks the dip, and damps the scale back to `[1,1,1]` when idle; the torch anchor is untouched. `npx tsc -b --pretty false`, `npm run lint` (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`), `npx vitest run` (11/11), and `npm run build` pass. Browser verification pending: the hero slides along corridor walls instead of clipping, never climbs the low ledges, and visibly bobs plus squashes while walking in both manual and auto modes.

**Next Step:** Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero's behavior tree).

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

#### Status update (2026-11-10, micro-steps 05-08-01 and 05-09-01)

AI visualization and seed hardening are implemented. `src/game/ai/HeroTree.ts` now exposes `blackboard.activeState` and updates it in `findDestination`, `findKey`, `findStairs`, `moveAlongPath`, and `interact`; `moveAlongPath` preserves the goal label while a path is active and resets to `Idle` only when the path is exhausted. `src/components/hero/Hero.tsx` (the step doc's stale `src/game/Hero.tsx` path) samples the blackboard at 10 Hz with a time accumulator, renders a Drei `Html` status chip above the hero in auto mode, and renders a Drei `Line` outside the `RigidBody` so the path stays in world space. The debug path converts grid cells through `gridToWorld` and uses `FLOOR_TOP + 0.06` instead of the contract's incorrect `0.85` height.

`src/game/pathfinding.ts` now exposes the underlying `graph` and `validateNode`, guards invalid layouts with an empty graph, rounds cell coordinates so node ids cannot drift from node data, and preserves deterministic start-to-target routes. New `tests/integration.test.ts` adds the contract's two integration checks plus invalid-layout safety and layout re-indexing. `npx vitest run` passes 15/15; `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` pass. Browser verification of the AI label, path line, and step 5 acceptance remains pending.

#### Status update (2026-11-10, micro-steps 05-08 and 05-09)

Autonomous exploration hardening and Step 5 acceptance checks are implemented. `src/game/ai/HeroTree.ts` now caps path requests at 4 Hz, avoids wander targets on the hero's current cell, tracks progress with `delta` plus `elapsedTime`, and triggers a deterministic fallback route after 1.5 seconds without movement. `src/components/hero/Hero.tsx` supplies the frame clock to the blackboard. `tests/herotree.test.ts` adds coverage for the 4 Hz throttle and stalled-route recovery. `npx vitest run` passes 17/17; `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and `git diff --check` pass (the only `git diff --check` output is the existing Windows LF-to-CRLF warning for `Hero.tsx`). Browser acceptance for manual override, the four-second idle return, collision, stuck recovery, and the full Step 5 feature set remains pending, so `docs/steps/INDEX.md` 5.08 and 5.09 stay unticked.

#### Status update (2026-11-10, Step 5 browser bug fixes)

User browser testing exposed four runtime defects after 05-08/05-09: wall clipping on the northeast and southeast sides, a bright disc on the hero's back when walking northwest, the whole floor moving during movement (motion sickness), and glitchy auto-walk. Fixes:

- `Hero.tsx` now uses `colliders={false}` plus one explicit `CapsuleCollider` (`args={[0.37, 0.28]}`, centre `y = 0.65`) and drives `computeColliderMovement` from a collider ref. The previous `colliders="cuboid"` auto-generated one collider per mesh, and `body.collider(0)` used a single boot offset from the body centre, which caused the asymmetric wall clipping. This also restores the capsule required by 05-04.
- The per-frame camera follow and look-ahead block was removed. `IsometricCamera` keeps its fixed framing, so the diorama no longer swims while the hero moves. This deliberately supersedes the 05-07-01 look-ahead behavior per direct user feedback.
- `useTorchFlicker.ts` forces `light.target.updateWorldMatrix(true, false)` every frame, so the beam follows the rotating torch anchor instead of aiming at a stale world point and lighting the hero's back.
- Auto-walk glitching is addressed by the capsule/controller fix plus the existing 4 Hz replan cap and stuck recovery.

`npx tsc -b --pretty false`, `npm run lint`, and `npx vitest run` (17/17) pass. `npm run build` and `git diff --check` results are reported with this change. Browser re-verification is required before approving 05-08/05-09.

**Next Step:** Step 6: Entity Spawning & Interactions (Placing chests, keys, and wiring the ECS interaction system to the Hero's behavior tree).

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
- **2026-11-09 — 4.06 Instanced floor rendering:** Kept and refined the staged floor work. `floorInstances.ts` builds one matrix per floor cell from the shared `gridToWorld` transform, aligns tile tops with `FLOOR_TOP`, and caches by `${seed}:${size}`. `DungeonFloor.tsx` copies the cached matrices into one `InstancedMesh` with a unit-footprint box; the inset scale lives only in the instance matrix. The verifier now checks matrix count, caching, scale, and per-cell positions across 500 seeds.
- **2026-11-09 — 4.07 Instanced wall rendering:** Added `wallInstances.ts` and `DungeonWalls.tsx`. Wall cells split into tall and low batches, each with fixed-height box geometry, so instance transforms stay per-tile and never stretch the stone pattern. Tall walls are `2.2` high, low ledges `0.6`. No transparency, fade, or per-frame occlusion logic was introduced.
- **2026-11-09 — 4.08 One compound static Rapier collider:** Added `rectangles.ts` for deterministic greedy 2D merging and `colliders.ts` for pure cuboid specs. `DungeonCollider.tsx` is one fixed `<RigidBody colliders={false}>` with merged floor cuboids, one cuboid per merged wall run, and the plinth cuboid. Floor tops sit at `FLOOR_TOP`; all wall colliders use the full tall height, including visually low ledges, per the user's confirmation. `walls.ts` now shares the rectangle merge helper.
- **2026-11-09 — 4.09 Diorama plinth and floor-edge trim:** Added `DungeonPlinth.tsx`. The `20.8 x 0.8 x 20.8` block has its top at `y = 0`; four thin `0.15` contrasting rails sit just below the top edge. The first attempt used one full-footprint slab, which covered the whole plinth top in trim color and made the floor read as the dark void; rails preserve a dark plinth top. The plinth deliberately does not cast shadows, because its large top face in the shadow map can cause acne on the thin floor plates. Floor material was lightened to `#3c4a60` for corridor legibility. No global styles or color tokens were changed.
- **2026-11-09 — 4.10 Development Stats and runtime physics-debug controls:** Added `DebugOverlay.tsx` and its SCSS module, plus `DungeonStats.tsx`. The overlay is development-only, starts closed, and shows depth, seed, rooms, floor cells, and wall runs. It toggles `StatsGl` (off by default) and runtime Rapier debug rendering. `GamePhysics.tsx` now reads `physicsDebug` from Zustand; `VITE_DEBUG_PHYSICS` remains the initial value. Production builds render no controls.
- **2026-11-09 — 4.11 Compose dungeon in App and remove temporary probes:** Added `Dungeon.tsx` to compose the plinth, floor, walls, and collider from one layout. `App.tsx` mounts only the dungeon inside the existing canvas, camera, lighting, physics, and effects. Deleted `Floor.tsx`, `FloorCollider.tsx`, `PhysicsProbe.tsx`, and `ReferenceBlock.tsx`. The temporary badge now reads `Step 4 - Dungeon Generation` and shows depth plus seed.
- **2026-11-09 — 4.12 Step 4 acceptance checks (awaiting browser approval):** Extended `scripts/verify-dungeon.mjs` to verify floor instance matrices, wall instance matrices, exact merged floor collider coverage, full-height wall colliders, plinth collider dimensions, and spawn placement. All 500 seeds pass; `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and `git diff --check` pass. A headless Chrome capture showed the instanced dungeon, plinth, and development button; a raw no-effects capture exposed plinth shadow acne on the floor, which was fixed by removing the plinth's cast shadow. Final user browser acceptance, INDEX ticks, the parent Step 4 completion, and the commit remain pending.
- **2026-11-09 — Step 4 approved and complete:** The user approved Step 4 and committed the approved changes as `b3ce0b5`. Micro-steps 4.06 through 4.12 are ticked in `docs/steps/INDEX.md`, and the next task is Step 5. During visual acceptance the plinth trim was changed from one full-footprint top slab to four thin rails so the plinth top stays dark, and the floor material was lightened to `#3c4a60` for corridor legibility.
- **2026-11-09 — 5.01 Hero visual model (awaiting browser approval):** Added `src/components/hero/Hero.tsx`, a grouped primitive-box hero with feet at the group origin, roughly `1.3` world units tall, local forward `-Z`, and a default `rotationY` of `-Math.PI * 0.75` so he faces the fixed isometric camera and both hands stay visible. Shoulders stay under the proposed `0.28` capsule radius. The right hand holds a torch with a wood handle, iron bowl, and orange head placeholder; the left hand holds a sword with a leather grip, steel crossguard and pommel, bright tapered blade, and a small glowing gem. Temporarily mounted in `App.tsx` at `layout.spawn` inside `GamePhysics`; no ECS, physics, input, or AI code was added. User feedback that the hero looked out of focus was traced to the Step 2 tilt-shift mask: with `focusArea={0.35}` and `feather={0.5}`, the sharp band collapses toward screen center and the hero at roughly 36% screen height sat in the blurred falloff. Raised `focusArea` to `0.75` in `Effects.tsx`; the diorama edges stay soft while the play area is sharp. `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` pass. `git diff --check` flags only `README.md:151 new blank line at EOF`, an unrelated uncommitted README rewrite already present in the working tree; all Step 5 paths pass the scoped check. Headless Chrome captures at `http://localhost:5199/` show the hero grounded at spawn, facing camera, with both torch and sword readable. INDEX is not ticked.
- **2026-11-09 — 5.01 approved:** The user approved the revised hero visual model and said they will commit the changes. 5.01 is ticked in `docs/steps/INDEX.md`; work moves to 5.02 (torch visuals and efficient lighting).
- **2026-11-09 — 5.02 Torch visuals and efficient lighting (awaiting browser approval):** Added `TorchLight.tsx` as a child of the torch group in `Hero.tsx`, so the effect follows the hero hierarchy without extra transforms. It renders a layered emissive flame (outer orange, inner amber, bright tip) and one shadow-casting spotlight with a 512px map aimed forward and down through an in-scene target object. Flame meshes deliberately do not cast shadows so they cannot block their own beam. Added `useTorchFlicker.ts`, which mutates the light intensity and flame scale with two fixed-frequency sine waves from the frame clock; no per-frame allocations and no randomness. Base spotlight intensity is `70` with `distance={9}`, `angle={Math.PI / 4}`, `penumbra={0.65}`, and `decay={2}`. No global bloom or new effect pass was added, and the existing post-processing is untouched. `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` pass. Full `git diff --check` still reports only the unrelated `README.md:151` blank-line warning; the scoped Step 5 check passes. Headless captures show the flame attached to the hero and a warm light pool on the floor ahead without washing out the palette. INDEX 5.02 remains unticked.
- **2026-11-09 — 5.00 Preflight and dependencies:** Executed `docs/steps/05-hero-and-ai/05-00-preflight.md`. Added `vitest@^3.2.7`, `ngraph.path@^1.6.1`, and `mistreevous@^4.3.1` to the `package.json` dependencies (Vite and Rapier untouched) and added the `"test": "vitest"` script. Extended the Miniplex `Entity` in `src/types/index.ts` per the Step 5 API contract: added `isPlayer?: boolean` and `heading?: number` (radians for visual mesh rotation), and retyped `velocity` from `Vector3` to `[number, number, number]` (`[x, y, z]` movement vector). The retyping broke two `Vector3` initializers in `src/game/ecs.ts` (`createHero`, `createMonster`); since the preflight requires `tsc` to pass, those were surgically fixed to `velocity: [0, 0, 0]` — a documented exception to the target-files-only constraint. The preflight cleanup section was a no-op: `PhysicsProbe`, `ReferenceBlock`, `Floor.tsx`, `FloorCollider.tsx`, and the `FLOOR_THICKNESS` imports were already removed in Step 4, and the preflight's `src/game/App.tsx` path is a stale name for `src/App.tsx`, which contains no Step 3 artifacts. `npx tsc -b --pretty false` passes. `npm install` was not run under this task's target-files-only constraint, so `package-lock.json` is unchanged; run the install before committing. Next task is the next Step 5 micro-step per `docs/steps/INDEX.md` (hero and AI logic).
- **2026-11-09 — Hero controller and playable movement (step doc 05-01; awaiting browser approval):** Implemented the playable hero controller per `docs/steps/05-hero-and-ai/05-01-hero-controller-and-visuals.md`. Numbering note: the step doc is `05-01-hero-controller-and-visuals.md` and this work is tracked as Step 05-01, while `docs/steps/INDEX.md` breaks the controller into micro-steps 5.04 (kinematic body), 5.05 (movement), and 5.06 (WASD input) and lists 5.01 as the visual model; this entry completes the controller portion. `src/hooks/usePlayerInput.ts` unifies keyboard (Drei `useKeyboardControls` non-reactive getter) and the first connected gamepad (left stick with a `0.2` deadzone) into a normalized XZ direction plus `isMoving`/`isManual`, exposed through a per-frame `sample()` so the frame loop can poll without triggering re-renders. `src/components/hero/Hero.tsx` is now the controller: a Rapier `RigidBody` with `type="kinematicPosition"`, `colliders="cuboid"`, `canSleep={false}`, and `lockRotations`, advanced each frame with `setNextKinematicTranslation`. The body never rotates; the heading is damped onto the walk-cycle visual group and the torch anchor group, which keeps the auto-generated cuboid collider axis-aligned and the spotlight free of the walk-cycle bob. Walk-cycle bob, heading, and the isometric camera follow are all damped with `maath`. Position, velocity, and heading are mirrored into the Miniplex entity every frame for AI and debug systems. The torch was split so the light no longer bobs: `useTorchFlicker.ts` now exports `useTorchFlicker` (the stable shadow-casting spotlight) and `useFlameFlicker` (the visual-only flame), and `TorchLight.tsx` renders the body-anchored spotlight plus `TorchFlame`, the flame meshes held in the hand. `src/App.tsx` wraps the `Canvas` in a Drei `KeyboardControls` provider mapping WASD and the arrow keys, and the badge now reads Step 5. Added `maath@^0.10.7` to `package.json`. `npx tsc -b --pretty false` passes. Stale plan paths: the step doc names `src/game/Hero.tsx` and `src/game/App.tsx`; the repo uses `src/components/hero/Hero.tsx` and `src/App.tsx`. The torch split and `maath` required edits beyond the three target files (`usePlayerInput.ts`, `Hero.tsx`, `App.tsx`); `TorchLight.tsx`, `useTorchFlicker.ts`, and `package.json` were also modified, intentionally exceeding the target-files-only constraint. Foundational pieces (velocity retyping, AI deps, torch split, `usePlayerInput`, step docs) are already committed in `da868f8` and `2435089`; the visual controller (`Hero.tsx`, `App.tsx`, `package.json`) awaits browser approval before committing together with this handoff. Manual verification: WASD and the arrow keys move the hero; the gamepad left stick works if a controller is connected; the hero collides with dungeon geometry; it faces its movement direction and bobs while walking; the torch spotlight stays stable while the model bobs; and the camera follows while preserving the isometric angle.
- **2026-11-10 — 05-02-01 Pathfinding graph and manual/auto idle state (committed as `e145dc2`):** Implemented `docs/steps/05-hero-and-ai/05-02-01-pathfinding-and-idle-state.md`. Mapping note: this step doc corresponds to INDEX micro-step 5.07 (grid-based pathfinding over DungeonLayout) plus the idle portion of 5.08 (autonomous exploration, idle return, and stuck recovery); the INDEX rows remain unticked. Added `ngraph.graph@^20.0.1` (20.1.2 installed) alongside the existing `ngraph.path@^1.6.1`. Discovered that `vitest` was referenced by the `test` script but missing from `package.json` (the 5.00 entry recorded adding it, but it was not in the working tree); added `vitest@^3.2.7` as a devDependency. `src/game/store.ts` (the step doc's `src/store.ts` is a stale path) now implements the contract's `isAutoMode`/`setAutoMode` and removes the old `isAutoPlaying`/`setAutoPlaying`/`lastInputTime`/`updateLastInputTime` scaffolding — that store's `updateLastInputTime` was exactly the per-frame Zustand write-spam anti-pattern this step eliminates. Behavior change per the contract: initial mode is now `false` (manual) instead of `true`; `descendToNextLevel` still resumes auto (`isAutoMode: true`). `src/types/index.ts` (protected by default) had to be updated because `GameState` lives there — a documented exception. `src/hooks/usePlayerInput.ts` now owns the idle timer: module-level `lastInputTime = performance.now()`, `IDLE_TIMEOUT_MS = 10000`, checked inside the per-frame `sample()`, Zustand written only when the mode actually flips, and the hook exports `isAutoMode` (a cheap reactive subscription). New `src/game/pathfinding.ts` exports `buildNavGraph(layout)`: one node per floor cell with id `"x,z"`, one directed link per 4-neighbor adjacency from each endpoint (both directions, reusing `CARDINAL_DIRECTIONS` from `./dungeon/pathfinding`), `aStar` with the contract's Manhattan `distance`, and `findPath` returning the start-to-end `GridCell[]` or `[]`. Important: `ngraph.path`'s `aStar().find()` throws for unknown node ids, so `findPath` guards with a floor id set — that guard is what makes the 05-04-01 assertion `findPath(0,0,99,99)` → `[]` hold. The existing `src/game/dungeon/pathfinding.ts` (BFS for corridor carving) is a separate module and was left untouched. `npx tsc -b --pretty false`, `npm run lint` (0 errors; one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`), and `npm run build` all pass. A temporary five-case vitest smoke test (route ordering, `[]` for off-graph targets, start==target, routing around a gap, determinism) passed and was removed; the official tests belong to 05-04-01. No visible browser change is expected until 05-03-01 consumes `isAutoMode` (the hero simply stands still). The user committed the work as `e145dc2`; note that the commit message appears to be the pasted 05-04-01 step-doc heading rather than a description of this step's work. Next task is 05-03-01 (behavior tree and auto movement), which will use `usePlayerInput().isAutoMode` and `buildNavGraph(layout).findPath(...)`.
- **2026-11-10 — 05-03-01 Behavior tree and auto movement (awaiting browser approval):** Implemented `docs/steps/05-hero-and-ai/05-03-01-behavior-tree-and-auto-movement.md`. Created `src/game/ai/HeroTree.ts`: `createHeroTree(navGraph, layoutCells)` builds the contract's MDSL tree (`root > selector > [sequence > (condition needsDestination, action findDestination), action moveAlongPath]`) with the blackboard as the Mistreevous agent holding `currentPath`, `position`, `outputDirection`, and the three leaves. Three contract-vs-library conflicts were resolved and recorded in section 2.19: the export is `BehaviourTree` (aliased to the contract's `BehaviorTree`), action leaves must return `State` values rather than booleans (the contract's booleans throw at runtime), and the contract's code mixed world/grid coordinate spaces (fixed with `gridToWorld` and its inverse). `src/components/hero/Hero.tsx` (the contract's stale `src/game/Hero.tsx` path) now derives the layout from the cached `getDungeonLayout(currentDepth)` and memoizes `navGraph` and the tree; in `useFrame` it samples input first, then reads `useGameStore.getState().isAutoMode`: auto mode copies the body translation into `blackboard.position`, calls `tree.step()`, and drives movement from `blackboard.outputDirection`; manual mode is unchanged. Heading, walk bob, camera follow, and the ECS velocity mirror all consume the unified movement direction. `lastInputTime` remains module-level in `usePlayerInput.ts`; no per-frame Zustand writes. `npx tsc -b --pretty false` passes; `npm run lint` has 0 errors (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`); `npm run build` exits 0. A temporary 30-second simulated vitest smoke test (route acquisition, unit output directions, route completion, re-acquisition) passed and was removed. Browser verification pending: the hero stands still in manual mode and wanders the dungeon automatically after 10 s idle; any WASD/arrow/gamepad input returns control immediately.
- **2026-11-10 — 05-05-01 Hero AI interactions:** Extended `src/game/ai/HeroTree.ts` to the POI objective tree: optional third `world` parameter to `createHeroTree` (defaults to the shared ECS world, so `Hero.tsx` is unchanged), one live POI query `world.with('poiType', 'position', 'isActive')` per tree, `findKey`/`findStairs`/`acquirePathTo` using `worldToGrid` and `.x`/`.z` (the contract's `position[0]`/`[2]` tuple access does not match the `Vector3`-typed `Entity.position`), and an always-succeeding `interact` gate at the front of the key/stairs sequences that picks up the key (`hasKeyState = true`, key POI deactivated) and, on reaching the stairs while holding the key, deactivates the stairs POI and calls `descendToNextLevel()`. User-approved deviations recorded in section 2.19: `interact` moved to the front of the sequences (the contract's placement ran the pickup only on the re-pathing frame after arrival), and `hasKey` is a condition leaf so it must be a function with the raw state in `hasKeyState`. `Entity` gained `poiType` and `isActive`. Verified with a temporary esbuild harness over the real modules: no-POI wander unchanged, key pickup, POI deactivation, and descent (depth 1 to 2) all fired. `npx tsc -b --pretty false`, `npm run lint` (one pre-existing warning), and `npm run build` pass. Expected dirty files: `src/game/ai/HeroTree.ts`, `src/types/index.ts`, and this file.
- **2026-11-10 — 05-04-01 Visual rotation, ECS sync, and pathfinding tests (awaiting browser approval):** Implemented `docs/steps/05-hero-and-ai/05-04-01-ecs-sync-and-tests.md`. Stale-path note: the step doc's target `src/game/Hero.tsx` is `src/components/hero/Hero.tsx` in this repo; that file already satisfies the contract's rotation requirement (`dampAngle` toward `Math.atan2(-moveDir.x, -moveDir.z)` on the walk-cycle group and torch anchor group, with the kinematic RigidBody itself never rotating) and the ECS sync requirement (`createHero` entity on mount, `world.remove` on unmount, per-frame mirror of `position`/`velocity`/`heading` from the Rapier body), so it needed no changes. The only missing "Required Logic" item was the torch sway: `useTorchFlicker.ts`'s existing `useFrame` now also oscillates the spotlight's `position.y` by `Math.sin(time * 8) * 0.05` around the torch anchor, and the hook docstring was updated to match. New `tests/pathfinding.test.ts` covers the contract's two required assertions — `findPath(0, 0, 1, 1)` on the L-shape layout returns the full sequence `[{x:0,z:0},{x:1,z:0},{x:1,z:1}]`, and `findPath(0, 0, 99, 99)` returns `[]` — plus start==target (single-cell path), routing around a gap, and determinism across two independent `buildNavGraph` builds. `npx vitest run` passes 5/5; `npx tsc -b --pretty false` passes; `npm run lint` has 0 errors (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`). Note: tsconfig `include` is `["src"]`, so `tsc -b` does not type-check the test directory; Vitest transpiles it via esbuild. Browser verification pending: the torch beam gently bobs while the hero walks; no other visible change is expected.
- **2026-11-10 — Hero tree hardening: permanent tests, store key state, nearest POI, seeded wander (user-approved follow-up to 05-05-01):** New permanent `tests/herotree.test.ts` (6 tests) drives the real tree over a real `miniplex` world, the real `useGameStore`, and the real nav graph: no-POI wander moves the hero, same-seed wander is deterministic, key pickup deactivates the POI and sets the store flag, nearest-key and nearest-stairs selection beat the first-spawned POI, and the full walk-to-key-then-descend flow fires depth 1 to 2 with both POIs deactivated and the key consumed. `GameState` gains `hasKey`/`setHasKey` (`src/types/index.ts`, documented exception); pickup sets it alongside `hasKeyState`, and `descendToNextLevel` resets it (the key is consumed by the descent). `findKey`/`findStairs`/`interact` now use the blackboard's `nearestActivePoi` (squared grid distance, ties by entity order) instead of first-match `.find`. `findDestination` uses `createRandom` (seeded Mulberry32, the project convention) via a new fourth `createHeroTree` parameter defaulting to `DUNGEON_DEFAULT_SEED`; `Hero.tsx` passes `layout.seed` and the shared world explicitly. `npx vitest run` passes 11/11; `npx tsc -b --pretty false`, `npm run lint` (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`), and `npm run build` all pass. Expected dirty files: `src/game/ai/HeroTree.ts`, `src/game/store.ts`, `src/types/index.ts`, `src/components/hero/Hero.tsx`, `tests/herotree.test.ts`, and this file.
- **2026-11-10 — 05-06-01 Character controller and procedural polish:** Implemented `docs/steps/05-hero-and-ai/05-06-01-collision-polish-and-animation.md`. Stale-path note: the step doc's `src/game/Hero.tsx` is `src/components/hero/Hero.tsx` in this repo. Upgraded Hero physics to use Rapier's Kinematic Character Controller for safe wall-sliding and added procedural squash-and-stretch walk cycle animations: a `useMemo` keyed on the `useRapier()` world (bound as `physicsWorld` to avoid the ECS `world` import) creates one `KinematicCharacterController` with offset `0.05`, calls `disableAutostep()` so the hero cannot climb the diorama walls, and a `useEffect` cleanup releases it via `world.removeCharacterController` (the approved 05-05 disposal requirement; the contract's snippet omitted it). Per-frame movement now flows through `body.collider(0)` → `computeColliderMovement(collider, move)` → `computedMovement()` → `setNextKinematicTranslation` instead of adding the raw vector, and the visual group squashes and stretches on the same shared phase as the bob, `sin(elapsedTime * 10)` (X/Z `0.05`, Y `0.1`), so the stretch tracks the rise and the squash tracks the dip (the contract snippet's separate 15 rad/s frequency would have drifted out of phase with the verified bob; unified to the shared phase); when idle the scale damps back to `[1,1,1]`. Verified against the installed `@dimforge/rapier3d-compat` 0.19.2 types: `createCharacterController` takes only the offset (autostep is opt-in via `enableAutostep`, hence the explicit `disableAutostep`), and `computeColliderMovement`'s `Vector` parameter is a plain `{x,y,z}` so the existing `THREE.Vector3` scratch vector is structurally compatible. `npx tsc -b --pretty false`, `npm run lint` (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`), `npx vitest run` (11/11), and `npm run build` pass. Browser verification pending: the hero slides along corridor walls instead of clipping, never climbs the low ledges, and visibly bobs plus squashes while walking in both manual and auto modes. Expected dirty files: `src/components/hero/Hero.tsx` and this file.
- **2026-11-10 — 05-07-01 Cinematic camera look-ahead and ambient torch dynamics:** Implemented `docs/steps/05-hero-and-ai/05-07-01-cinematic-camera-and-torch.md`. Added cinematic camera look-ahead based on velocity and integrated procedural multi-frequency torch flicker for ambient dungeon lighting. Stale-path note: the step doc's `src/game/Hero.tsx` is `src/components/hero/Hero.tsx` in this repo. The camera follow in `useFrame` now targets the isometric `CAMERA_OFFSET` plus the current movement direction scaled by `LOOK_AHEAD_FACTOR = 2.5` (`moveDir` is null when idle, so the target settles back to the plain follow position), still damped with `damp3` (lambda `0.2`) and `lookAt` on the hero; the target is passed as an array, so no `THREE.Vector3` is allocated in the frame loop. `TorchLight.tsx`'s spotlight JSX now uses the contract's warm color `#ffb74d`, angle `0.6`, and penumbra `0.5` (initial `intensity={70}` unchanged; the flicker hook overwrites it every frame). `useTorchFlicker.ts`'s flicker is now the contract's composite wave `sin(t * 17) * 0.15 + cos(t * 23) * 0.15` (prime multipliers avoid repeating visual patterns), applied as `BASE_INTENSITY * (1 + flicker / 2)`: the contract's reference `2.0 + flicker` is written in legacy light units, while this project renders in physical units (three 0.187; base `70` per the approved 5.02 decision), so the same wave is scaled onto the physical base intensity, preserving the identical relative depth (base +/- 15%) without regressing the browser-approved look. The 8 rad/s sway from 05-04-01 (`position.y = sin(t * 8) * 0.05`) is unchanged. `npx tsc -b --pretty false`, `npm run lint` (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`), `npx vitest run` (11/11), and `npm run build` pass. Browser verification pending: while the hero walks (manual or auto) the camera leads a couple of tiles in front of it and eases back when it stops, and the torch light flickers organically with the warmer tint. The "Next Step" above already states Step 6: Entity Spawning & Interactions, as this step requires. Expected dirty files: `src/components/hero/Hero.tsx`, `src/components/hero/TorchLight.tsx`, `src/components/hero/useTorchFlicker.ts`, and this file.
- **2026-11-10 — 05-07-01 follow-up: look-ahead refinements and conflict resolutions (user-approved):** Applied the three optional suggestions and closed out the four recorded conflicts. (1) `LOOK_AHEAD_FACTOR` is now `SPEED * 0.5` (same 2.5 value) so the camera lead stays proportional if walk speed ever changes. (2) The camera `lookAt` now aims one unit in front of the hero while it moves (`LOOK_AT_LEAD = 1`) and settles back on the hero when idle, framing more of the path ahead. (3) The spotlight `angle` widened from `0.6` to `0.7`: the contract's "wider angle (e.g. 0.6)" wording was inverted (0.6 is narrower than the previous `Math.PI / 4`), and 0.6 shrank the floor light pool; 0.7 keeps the pool readable while staying close to the contract value. (4) `useTorchFlicker.ts` names the legacy base (`CONTRACT_LEGACY_BASE_INTENSITY = 2`) so the legacy-to-physical unit conversion is explicit at the point of use. Conflict status: the light-units conflict is now self-documenting in code; the stale `src/game/Hero.tsx` contract path stays documented here (the step doc is preserved as issued); the contract's `torchRef`-as-light mismatch stays resolved architecturally (the flicker lives in `useTorchFlicker.ts`, not `Hero.tsx`); no package/library/version conflicts exist. `npx tsc -b --pretty false`, `npm run lint` (one pre-existing `react-hooks/exhaustive-deps` warning in `usePlayerInput.ts`), `npx vitest run` (11/11), and `npm run build` pass. Browser verification pending: the camera leads the hero and aims slightly ahead while walking (manual and auto), the torch pool reads well at corridor distance, and the flicker is unchanged. Expected dirty files: `src/components/hero/Hero.tsx`, `src/components/hero/TorchLight.tsx`, `src/components/hero/useTorchFlicker.ts`, and this file.
- **2026-11-10 - 05-08-01 AI state visualization and path debugging:** Implemented `docs/steps/05-hero-and-ai/05-08-01-ai-visualization.md`. `src/game/ai/HeroTree.ts` now exposes `blackboard.activeState` (`Idle`, `Wandering`, `Seeking Key`, `Seeking Stairs`, `Key Acquired`, `Descending`) and updates it from the objective actions. `src/components/hero/Hero.tsx` samples that state at 10 Hz with a time accumulator, shows a Drei `Html` status chip above the hero in auto mode, and draws the remaining path with Drei `Line` outside the `RigidBody`. Contract conflicts resolved: the snippet's corrupted `Html` props were interpreted as `position={[0, 2, 0]}`, `center`, and `pointerEvents="none"`; grid path cells are converted through `gridToWorld`; and the path height is `FLOOR_TOP + 0.06` instead of the incorrect `0.85`. The contract's `floor(time * 10) % 2` throttle was replaced with a true 100 ms interval. `moveAlongPath` preserves the current goal label while moving and resets to `Idle` only when the path is empty. `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run` (15/15), and `npm run build` pass. Browser verification pending.
- **2026-11-10 - 05-09-01 Seed resilience and integration hardening:** Implemented `docs/steps/05-hero-and-ai/05-09-01-seed_resilience_and_hardening.md`. `src/game/pathfinding.ts` now exposes the underlying `graph`, adds `validateNode`, returns an empty safe graph for an invalid layout, rounds cell coordinates so node ids match node data, and keeps deterministic start-to-target routes. New `tests/integration.test.ts` covers the contract's valid-path and node-validation checks plus invalid-layout safety and layout re-indexing. `npx vitest run` passes 15/15; `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` pass. Step 5 browser acceptance remains pending, so the `docs/steps/INDEX.md` 5.08 and 5.09 rows stay unticked.
- **2026-11-10 - 05-08 Autonomous exploration, idle return, and stuck recovery:** Implemented `docs/steps/05-hero-and-ai/05-08-autonomous-exploration-idle-return-and-stuck-recovery.md`. The existing wander, four-second idle return, manual override, Rapier collision, and cached-path behavior were already present. Added a 4 Hz path-request cooldown, current-cell target avoidance, and deterministic stuck recovery in `HeroTree.ts`. The blackboard tracks `delta`, `elapsedTime`, `lastProgress`, `stuckTime`, and a rotating `fallbackIndex`; after 1.5 seconds without meaningful movement it scans `layoutCells` in deterministic order for a reachable fallback goal and sets `activeState` to `Recovering`. `Hero.tsx` now writes the frame clock into the blackboard. `tests/herotree.test.ts` adds throttle and stalled-route tests. `npx vitest run` passes 17/17; `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` pass. Browser verification remains pending.
- **2026-11-10 - 05-09 Step 5 integration and acceptance (automated checks only):** Ran the acceptance verification commands. `npx tsc -b --pretty false` passes; `npm run lint` passes; `npm run build` passes with the existing Sass legacy API and large-chunk warnings; `git diff --check` reports only the Windows LF-to-CRLF warning for `src/components/hero/Hero.tsx`. Browser acceptance is still required for spawn alignment, grounded movement, wall collisions, torch lighting, ECS uniqueness and cleanup, WASD override, exact four-second idle return, pathfinding, and stuck recovery. Do not tick 5.08 or 5.09, commit, or start Step 6 until the user confirms the browser checks.
- **2026-11-10 - Step 5 browser bug fixes (awaiting re-verification):** Fixed the four defects reported after browser testing. `Hero.tsx` replaces the auto-generated per-mesh cuboid colliders with one explicit `CapsuleCollider` (`args={[0.37, 0.28]}`, `position={[0, 0.65, 0]}`, `colliders={false}`) and uses a collider ref for `computeColliderMovement`; `body.collider(0)` had been a single boot offset from the body centre, causing asymmetric clipping on the northeast and southeast walls. The per-frame camera follow, `CAMERA_OFFSET`, `LOOK_AHEAD_FACTOR`, and `LOOK_AT_LEAD` were removed so `IsometricCamera` stays fixed and the floor no longer swims; this intentionally supersedes 05-07-01's look-ahead on direct user feedback. `useTorchFlicker.ts` now calls `target.updateWorldMatrix(true, false)` every frame so the spotlight tracks the rotating torch anchor instead of aiming at a stale world point and producing the bright disc on the hero's back. Auto-walk smoothness benefits from the capsule/controller fix plus the existing 4 Hz replan cap and stuck recovery. `npx tsc -b --pretty false`, `npm run lint`, and `npx vitest run` (17/17) pass; `npm run build` and `git diff --check` are reported with the change. Browser re-verification is pending; 5.08 and 5.09 remain unticked and uncommitted.
- **2026-11-11 - 7.02 View Transitions helper and reduced-motion fallback:** Added `src/game/ui/screenTransition.ts` with `prefersReducedMotion`, `runScreenTransition`, and `commitScreenEvent`. The helper feature-detects `document.startViewTransition` with the document bound as `this`, runs the React update under `flushSync` inside the transition callback, and falls back to a direct update when the API is missing or reduced motion is requested. `startViewTransition` and `reducedMotion` are injectable so the behavior is testable in node. Added 7 tests covering callback ordering, unsupported-browser fallback, reduced motion (no transition started), missing `matchMedia`, event application, and blocked events. No SCSS module was needed: the shared root transition duration already lives in protected `global.scss`, and screen-specific styles arrive with 7.03. No visible behavior changed because no screen rendered yet; the animation check is deferred to 7.03. `npx tsc -b --pretty false`, `npm run lint`, `npm test` (37 files / 184 tests), `npm run build`, and `git diff --check` pass. Approved by the user on 2026-11-11.
- **2026-11-11 - 7.01 Screen-state model and transition boundaries:** Added `src/game/ui/screenState.ts` with a pure `ScreenState` union (`mainMenu`, `playing`, `gameOver`), four screen events (`startGame`, `heroDied`, `restart`, `returnToMenu`), an explicit transition table, and `canTransition`/`nextScreen` helpers. Added `src/game/ui/screenStore.ts`, a small Zustand store holding only the current screen; blocked events return the existing state object, so subscribers do not re-render. Kept screen state out of protected `src/types/index.ts` and out of the existing aggregate `GameState`. Added 7 tests covering every allowed and blocked edge plus store sequencing and reset. No App wiring, screens, CSS, or View Transition code was added. `npx tsc -b --pretty false`, `npm run lint`, `npm test` (36 files / 177 tests), `npm run build`, and `git diff --check` pass. Approved by the user on 2026-11-11.
- **2026-11-11 - 06-09 Step 6 integration and acceptance:** Added `src/game/monsters/step6Scenario.test.ts`, a fixed-seed (42, depth 1) end-to-end scenario covering deterministic spawn plan and placement, ECS creation, proximity-index size, real-brain aggro and navigation without leaving walkable cells, one sword hit per monster per swing, damage through `resolveHits` until death, death-event queueing and index cleanup, monster wind-up/cooldown/strike timing, hero damage with 700 ms i-frames, and knockback direction/fade. No production code changed. `npx tsc -b --pretty false`, `npm run lint`, `npm test` (35 files / 170 tests), `npm run build`, and `git diff --check` pass; the build reports only the pre-existing large-chunk and Sass deprecation warnings. The user approved the complete Step 6 result after browser verification on 2026-11-11; 6.09 is ticked and Step 6 is closed. Known limitation: pooling/mesh recycling for dead monsters and hero death handling remain out of scope until later UI work, as planned.
- **2026-11-11 - 05-14 Step 5 integration and acceptance:** Added `src/game/hero/ai/exploreSim.test.ts`, a headless point-mass simulation over seeds 1 to 50. It mirrors the brain and intent loop (pick room, plan world path, smooth, consume waypoints within `HERO_WAYPOINT_REACH`, move at `HERO_SPEED` in 60 Hz steps) and asserts every room is visited within 60 simulated seconds per room, every sampled position is walkable, and no reachable route is null. Cleanup found no `TEMP`, `console.*`, or dead imports in `src`; the dev readout, path overlay, and click-to-route tool stay `import.meta.env.DEV` gated. Removed the unused `howler` and `@types/howler` dependencies. `npx tsc -b --pretty false`, `npm run lint`, `npm test` (83/83), `npm run build`, `node scripts/verify-dungeon.mjs` (500/500 seeds), and `git diff --check` pass. The production build contains no debug-overlay strings. Browser soak acceptance (seeds 1, 42, and a user seed) and the INDEX 5.14/header ticks remain pending.
