# Dungeon Dude - AI Handoff

Last updated: 2026-11-07
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

- **Current step:** Step 2 (Post-Processing Pipeline) is implemented, browser-verified, and approved by the user.
- **Last committed step:** Step 1, commit `239dc7c feat: scaffold app and isometric base scene`.
- **Step 2 commit status:** Committed together with this handoff document under `feat: add miniature diorama post-processing pipeline`.
- **Step 3 status:** Authorized by the user. The ECS, Zustand, physics, and plan-amendment decisions were confirmed on 2026-11-07. Implementation begins after the Step 2 commit.
- **Expected dirty files for the Step 2 commit:** `src/App.tsx`, `src/components/Effects.tsx`, `src/components/effects/Dither.ts`, and this file.

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

### 2.3 ECS package decision is still open, and the two Miniplex APIs must not be mixed

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

**Step 3: ECS Architecture and Physics Setup.** All decisions are confirmed; no further clarifying questions are required.

Package work:
1. Remove `@miniplex/core` and `@miniplex/react`: `npm uninstall @miniplex/core @miniplex/react`.
2. Upgrade Zustand: `npm install zustand@^5.1.0`.
3. Pin `react` and `react-dom` to `~19.3.1` to protect the R3F 9 peer range, then refresh the lockfile.
4. Keep `miniplex@2.0.0` as the only ECS package.

Implementation:
- `src/game/ecs.ts` with a module-level `World<Entity>`, typed entity factories for hero, monster, and prop, and archetype queries. No React imports.
- `src/game/store.ts` with a Zustand 5 store matching `GameState` from `src/types/index.ts`. UI and aggregate values only.
- Shared constants for floor size, gravity, and timestep, so visuals and colliders cannot drift apart.
- A physics wrapper around the scene with `timeStep={1/60}`, interpolation, gravity, and `VITE_DEBUG_PHYSICS` support.
- A fixed floor collider matching the visual floor.
- A temporary dynamic probe box above the floor to verify gravity and contact resolution.
- `VITE_DEBUG_PHYSICS` typing in `src/vite-env.d.ts`.

Verification:
- `npx tsc -b`
- `npm run lint`
- `npm run build`
- Browser check with physics debug enabled.
- Update this file, then ask the user to verify before committing with a message such as `feat: add ECS foundation and Rapier physics`.

Do not start Step 4 until the user approves Step 3.

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
