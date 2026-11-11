# Dungeon Dude — Micro-Step Execution Index

**Purpose:** Turn Steps 4–8 of `Dungeon_Dude_Plan.md` into small, independently executable Cline tasks suitable for a fresh chat using the local Qwen model with a 65,536-token context window.

**Target workflow:** VS Code + Cline 4.0.12 (or a later compatible release) → Ollama at `http://localhost:11434` → `qwen38-64k:latest`.

**Important:** This folder contains instructions only. It does not change the application architecture or install dependencies. The original high-level plan remains the roadmap; these files are the detailed execution prompts.

---

## 1. How to use this prompt pack

Start a **new Cline task** for every micro-step. Do not paste the entire project plan into the chat.

Copy this prompt and replace the file path with the one micro-step you are executing:

```text
Read `docs/steps/INDEX.md` and the single task file
`docs/steps/<STEP-FOLDER>/<MICRO-STEP-FILE>.md`.

Treat that micro-step file as the complete task scope. Inspect only the
source files it identifies and any directly required dependencies. Do not
read the entire Dungeon_Dude_Plan.md or AI_HANDOFF.md; read only the exact
sections requested by the task file.

Complete this micro-step only. Do not begin the next micro-step or implement
future-step features. Follow the verification and approval rules in INDEX.md.
When finished, report the result and wait for my approval before marking it
complete, updating the handoff/checklist, or committing.
```

A new Cline task should contain one micro-step only. Do not combine multiple numbered tasks even when they look related.

## 2. Global execution rules

### Scope and conversation size

- The target task file is the implementation specification. `INDEX.md` supplies these shared rules. Do not read the entire `Dungeon_Dude_Plan.md` or `AI_HANDOFF.md` just to understand a micro-step.
- Open only the source files named in the task's **Inspect first** section, plus additional files that are demonstrably necessary to complete that exact task.
- For `AI_HANDOFF.md`, search for the named heading or read only the relevant section/range. Do not load all 400+ lines into every new context.
- Do not re-explain or re-implement decisions already recorded in the handoff.
- The current source code is authoritative for what is actually present. `AI_HANDOFF.md` is authoritative for user-approved architectural decisions. If they conflict, stop and report the exact conflict; do not silently guess.
- The user's local repository is confirmed synchronized with GitHub `main` as of 2026-11-08. Still record the local `git rev-parse HEAD` during the first preflight task; do not assume a commit hash.

### Ask only when blocked

The older `Dungeon_Dude_Plan.md` says to ask clarifying questions before every coding task. For this micro-step workflow, the user has chosen to predefine the scope and decisions in these files. Therefore:

- Proceed without asking routine implementation questions when the task file and existing approved decisions provide enough information.
- Ask one concise question only when a missing decision genuinely blocks safe implementation, or when a protected file/dependency change is required.
- Do not invent product behavior, API contracts, dimensions, or data formats to avoid asking a necessary question.
- The actual repository `.cursorrules` contains architecture rules; it does not contain the older five-stage interaction loop. These prompt-pack rules govern the micro-step workflow.

### Architecture rules

- Keep game logic separate from rendering. React Three Fiber components should primarily render meshes/lights or compose focused components.
- Keep every component/module focused and under 200 lines where practical. Split logic into pure modules and hooks.
- Do not put per-frame positions, rotations, velocities, collision data, or rapidly changing health in React state or Zustand. Use Miniplex entities, refs, and Rapier for spatial/physics data. Zustand is for infrequent UI and aggregate state.
- Use the installed `miniplex@2.0.0` package only. Do not add `@miniplex/core` or `@miniplex/react`.
- Use the low-level Rapier character-controller API approved in `AI_HANDOFF.md` for Step 5. Never assume a React `<KinematicCharacterController />` exists.
- Use SCSS Modules for UI. Do not introduce a DOM animation library.
- Use relative imports. `tsconfig.json` has no `@` path mapping, even though Vite has an alias.
- Let the React Compiler optimize compiler-friendly components. Do not add `useMemo`/`useCallback` solely for memoization.
- Explain non-obvious logic with brief conversational JSDoc/TSDoc comments. No emoji or icons in code comments.
- Verify APIs against the installed package versions and local `.d.ts` files. Do not rely on remembered APIs from a different version.

### Protected files and dependency control

Do not edit or overwrite these existing protected files unless the user explicitly authorizes a change:

- `package.json`
- `package-lock.json`
- `index.html`
- `.cursorrules`
- `tsconfig.json`
- `eslint.config.js`
- `.prettierrc`
- `.env.development`
- `vite.config.ts`
- `src/types/index.ts`
- `src/styles/_variables.scss`
- `src/styles/global.scss`

The existing `src/types/index.ts` already defines `GridCell`, `DungeonRoom`, `WallHeight`, `DungeonWallCell`, `DungeonWallRun`, and `DungeonLayout`. Reuse these definitions; do not duplicate them or edit the protected types file.

- Do not install packages or change dependency manifests as part of a micro-step.
- Vitest is not installed. Do not add it without the user's explicit approval. Pure logic should be structured for testability; use the verification method specified by the task until a test runner is approved.
- If a task cannot be completed without changing a protected file or adding a dependency, stop and explain why before making that change.

### Required verification after every code-changing micro-step

Run from the repository root in PowerShell (or the equivalent terminal):

```powershell
npx tsc -b --pretty false
npm run lint
npm run build
git diff --check
git status --short
```

Report each command's result; never claim a check passed if it was not run. If a command fails, fix only failures caused by the current micro-step. Do not disguise pre-existing failures as success. The first Step 4 preflight establishes the baseline.

For visual, rendering, physics, movement, UI, or audio tasks, also provide a browser verification checklist. Use Cline's browser capability only if it is actually available and working. Otherwise give the user exact steps to verify locally and wait for their result. Do not claim browser verification occurred when it did not.

### Approval, handoff, checklist, and commits

1. Implement only the selected micro-step.
2. Report its objective, changed files, important implementation decisions, verification command results, browser-check instructions/results, and any known limitations.
3. **Wait for the user's explicit approval** after presenting the result. Do not mark a task complete merely because the code was written or checks passed.
4. After approval, tick only that micro-step in this `INDEX.md`.
5. Append one concise dated entry to the `## 8. Micro-Step Execution Log` section of `AI_HANDOFF.md` (create that section if absent). Do not rewrite the handoff or its historical decision log. Update the major-step status/next task only when a whole major step is completed.
6. Update `AI_HANDOFF.md` before creating the commit, as its handoff protocol requires.
7. Commit only after approval, using a focused conventional commit message. Report the commit hash. Do not combine unrelated work.
8. Do not start the next micro-step or the next major step until the user explicitly authorizes it.

A micro-step checkbox means **implemented, verified to the level required by that task, and user-approved**. It does not mean merely attempted.

A parent step (4, 5, 6, 7, or 8) may be marked complete only after its final integration/acceptance micro-step passes and the user approves the complete result. Never mark Step 4 complete when only 4.01, 4.02, or another individual task is done.

---

## 3. Current repository facts and Step 4 guardrails

These facts were checked against the synchronized public `main` source on 2026-11-08. Reconfirm them locally in `4.00`; the local filesystem wins if it differs.

- The game grid is 20×20 and one world unit represents one tile (`FLOOR_SIZE` is currently 20).
- The orthographic camera is fixed at `[20, 20, 20]`, aimed at the origin, with zoom 40.
- `src/types/index.ts` already contains the dungeon layout types listed above.
- `src/game/ecs.ts` owns one module-level `miniplex@2.0.0` world and typed entity factories.
- `src/game/store.ts` uses Zustand 5 for infrequent/aggregate game state.
- `GamePhysics.tsx` wraps scene contents inside `<Physics>` and currently derives debug rendering from `VITE_DEBUG_PHYSICS` at module load.
- `App.tsx` currently mounts the preview `Floor`, `FloorCollider`, `ReferenceBlock`, and `PhysicsProbe` inside the physics provider. Step 4 must replace the temporary preview/probes with the real dungeon without leaving duplicate geometry or colliders.
- `src/components/scene/IsometricCamera.tsx` fixes the camera at `[20, 20, 20]` and calls `lookAt(0, 0, 0)`.
- The installed stack includes React 19.3.1, R3F 9.8.2, Drei 10.7.9, Rapier 2.2.0, Three 0.187.0, Miniplex 2.0.0, and Zustand 5.1.0. Verify actual lockfile versions before using an API.
- There is no Vitest dependency.

### Approved Step 4 direction

The relevant approved decisions in `AI_HANDOFF.md` must be preserved:

- Deterministic, seeded procedural generation.
- Instanced floor and wall visuals; do not render one React mesh per tile.
- One fixed compound/static rigid body for the static level geometry, not a separate rigid body for every tile or wall.
- Precompute camera cutaways for the fixed isometric camera. Do not raycast occluders every frame.
- Keep collision shapes active where walls are visually cut away.
- Add the diorama plinth/floor-edge trim in Step 4.
- Remove `PhysicsProbe.tsx` and `ReferenceBlock.tsx` when the real dungeon replaces them.
- Add Drei Stats/StatsGl behind a development-only flag, default off.
- Add a temporary DOM debug toggle for Rapier physics rendering. The environment variable supplies the initial default; the UI toggle changes it at runtime. Keep both controls out of the final HUD/release experience.

The existing dungeon types have comments describing full-height walls on far edges of the diorama and low ledges elsewhere so the fixed camera can see into the dungeon. Preserve that intent and visually validate the actual edge orientation.

### Known baseline discrepancies to verify in 4.00

The public source inspected on 2026-11-08 showed these possible Step 3 inconsistencies. Do not assume they are still present; verify the local checkout and run the checks:

1. `Floor.tsx` and `FloorCollider.tsx` import `FLOOR_THICKNESS`, but the inspected `src/game/constants.ts` did not export it.
2. `GameState` in `src/types/index.ts` requires `debugPanelOpen`, `physicsDebug`, `toggleDebugPanel`, and `togglePhysicsDebug`, but the inspected `src/game/store.ts` did not initialize/implement those members.
3. `AI_HANDOFF.md` says Step 3 was approved/committed in Section 1, while Section 6 still says to finish Step 3 and ask permission before Step 4. Section 7 attributes the interaction loop to `.cursorrules`, although the inspected `.cursorrules` contains architecture rules only. Preserve history; add a dated correction rather than rewriting old entries.

Do not start feature implementation until the baseline check is understood and any blocking compile failures are resolved.

---

## 4. Step 4 — Dungeon Generation

| Status | Micro-step | Task |
|---|---|---|
| [x] | 4.00 | Read-only baseline audit and dungeon design proposal |
| [x] | 4.01 | Repair confirmed Step 3 baseline inconsistencies |
| [x] | 4.02 | Dungeon configuration, deterministic seed, and PRNG |
| [x] | 4.03 | Bounded, non-overlapping room placement |
| [x] | 4.04 | Corridor carving and guaranteed connectivity |
| [x] | 4.05 | Perimeter walls, camera cutaways, and merged wall runs |
| [x] | 4.06 | Instanced floor rendering |
| [x] | 4.07 | Instanced wall rendering |
| [x] | 4.08 | One compound static Rapier collider |
| [x] | 4.09 | Diorama plinth and floor-edge trim |
| [x] | 4.10 | Development Stats and runtime physics-debug controls |
| [x] | 4.11 | Compose dungeon in App and remove temporary probes |
| [x] | 4.12 | Step 4 end-to-end acceptance and handoff |

## 5. Step 5 — Hero and Autonomous AI

| Status | Micro-step | Task |
|---|---|---|
| [x] | 5.00 | Preflight, dependencies, and test runner |
| [x] | 5.01 | Hero entity and kinematic capsule |
| [x] | 5.02 | Hero visual model |
| [x] | 5.03 | Torch light, flame, and embers |
| [x] | 5.04 | Input module and manual-control clock |
| [ ] | 5.05 | Character-controller movement |
| [ ] | 5.06 | Facing, walk cycle, and torch sway |
| [ ] | 5.07 | Camera follow |
| [ ] | 5.08 | Navigation grid and path planning |
| [ ] | 5.09 | Path smoothing |
| [ ] | 5.10 | Path debug overlay |
| [ ] | 5.11 | Explore goals and stuck detector |
| [ ] | 5.12 | Waypoint following and mode arbitration |
| [ ] | 5.13 | Behavior-tree brain and autonomous exploration |
| [ ] | 5.14 | Step 5 integration and acceptance |

## 6. Step 6 — Monsters and Combat

| Status | Micro-step | Task |
|---|---|---|
| [ ] | 6.01 | Monster archetype data and entity contract |
| [ ] | 6.02 | Monster visual component |
| [ ] | 6.03 | Deterministic monster spawning and ECS lifecycle |
| [ ] | 6.04 | Spatial grid/hash proximity index |
| [ ] | 6.05 | Monster aggro and movement behavior |
| [ ] | 6.06 | Rapier sensor-based sword hit detection |
| [ ] | 6.07 | Damage resolution and readable combat feedback |
| [ ] | 6.08 | Death handling, pooling, and cleanup |
| [ ] | 6.09 | Step 6 integration and acceptance |

## 7. Step 7 — UI and View Transitions

| Status | Micro-step | Task |
|---|---|---|
| [ ] | 7.01 | Screen-state model and transition boundaries |
| [ ] | 7.02 | View Transitions API integration and reduced motion |
| [ ] | 7.03 | Main Menu interface and start flow |
| [ ] | 7.04 | HUD: health, gold, and depth |
| [ ] | 7.05 | Game Over interface and restart/continue flow |
| [ ] | 7.06 | Responsive polish, accessibility, and Step 7 acceptance |

## 8. Step 8 — Audio and Deckard Cain TTS

| Status | Micro-step | Task |
|---|---|---|
| [ ] | 8.00 | Read-only asset and TTS API contract audit |
| [ ] | 8.01 | Howler AudioManager foundation |
| [ ] | 8.02 | Sound-effect loading, playback, and disposal |
| [ ] | 8.03 | User-gesture audio unlock and audio controls |
| [ ] | 8.04 | TTS client based on the verified local API contract |
| [ ] | 8.05 | TTS queue, cancellation, caching, and sound ducking |
| [ ] | 8.06 | Native popover dialogue UI and entry animation |
| [ ] | 8.07 | Step 8 end-to-end audio/TTS acceptance |

---

## 9. Suggested user instruction for completion

After Cline reports a micro-step finished and you have checked the result, reply:

```text
I approve this micro-step. Mark only this micro-step complete in INDEX.md,
append one concise dated entry to AI_HANDOFF.md, run git diff --check, and
commit the approved changes. Report the commit hash. Do not start the next
micro-step until I ask you to.
```

For the final micro-step of a major phase, use:

```text
I approve the complete major step. Mark its parent step complete, update the
current status and next task in AI_HANDOFF.md, append the completion log entry,
commit the approved changes, and report the commit hash. Do not begin the next
major step until I authorize it.
```
