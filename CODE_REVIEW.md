# CODE_REVIEW.md — Code Review Work Order

**Project:** Dungeon Dude — self-playing isometric 3D dungeon crawler
**Date:** 2026-11-10
**Status:** ready to execute
**Supersedes:** the "Code Review Report" previously stored in this file. Its valid findings are folded into the tasks below; its false positives are listed in "Verified non-issues" so nobody re-fixes them.

This file is a self-contained work order. A fresh AI session with zero prior context can pick it up and resolve the issues one task at a time.

---

## 0. How to use this file (read first)

Workflow for every task:

1. Work on exactly ONE task at a time, in the "Recommended execution order" (or the task the user names).
2. Read the task's "Current behavior" and "Fix" sections, then inspect the listed files. Line numbers are as of 2026-11-10; if they drifted, re-locate by the quoted symbol/snippet.
3. Implement the fix. Do not change behavior beyond what the task specifies.
4. Run every command in the task's "Verify" section and report the exact result of each.
5. Report and wait for user approval.
6. After approval: tick the task's checkbox, append a one-line dated entry to "Completion log", and commit only the files that task changed.

Rules:

- Do not add dependencies.
- Do not edit files outside a task's "Files" list unless the task says otherwise.
- If a task's instructions conflict with the actual code, stop and report the conflict. Do not guess.
- Protected files (never change without explicit user approval): `tsconfig.json`, `vite.config.ts`, `AI_HANDOFF.md` (append-only log), `docs/steps/` (execution plans). `src/types/index.ts` and `src/styles/*` are protected except where a task explicitly names them.
- Architecture rules (from `.cursorrules`): no file may exceed 200 lines; per-frame data (positions, rotations, health) lives in the ECS world or refs, never React state; Zustand holds UI/aggregate state only; all shared types come from `src/types/index.ts`; JSDoc comments explain the "why" in plain prose (no icons/emoji).

## 1. Project snapshot (context for a fresh session)

- **What it is:** a procedurally generated 20x20 dungeon rendered as a tabletop diorama (tilt-shift, dither, grain, vignette) on a stone pedestal. A box-built hero plays itself via a Mistreevous behavior tree; WASD/arrows or a gamepad take over; after an idle timeout the AI resumes. One shadow-casting torch spotlight is the main light.
- **Stack (installed versions, from package.json):** React 19.3.1, react-dom 19.3.1, TypeScript 5.5.3, Vite 5.4.1, three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, @react-three/rapier 2.2.0, @react-three/postprocessing 3.2.2, postprocessing 6.39.6, miniplex 2.0.0, mistreevous 4.3.1, ngraph.graph 20.0.1, ngraph.path 1.6.1, zustand 5.1.0, maath 0.10.7, howler 2.2.4 (installed for Step 8, not yet used), vitest 3.2.7, eslint 9.9.0.
- **React Compiler** (`babel-plugin-react-compiler@1.0.0`, target '19') runs through the Babel-based Vite React plugin. This is intentional and approved — do not remove it.
- **State model:** `src/game/ecs.ts` exports one miniplex `world` for per-frame game data; `src/game/store.ts` is the Zustand store for UI/aggregate state (depth, gold, key, auto mode, debug flags); `src/hooks/usePlayerInput.ts` owns the manual/auto idle timer.
- **Determinism:** dungeon layout is seeded (`getDungeonLayout(depth)` caches per seed; depth 1 uses seed 1337). AI wander is seeded per depth. All generation is pure and verified by `scripts/verify-dungeon.mjs` (500 seeds).
- **Step status:** Steps 1–4 are approved and committed. Step 5 (hero and AI) is implemented in code (hero, torch, behavior tree, character-controller movement, WASD override, pathfinding, POI interaction, tests) but its `docs/steps/INDEX.md` checkboxes are stale and browser acceptance is pending. Steps 6–8 (monsters/combat, UI, audio/TTS) are planned. No POIs are spawned in the app yet, so key/stairs interaction is exercised only by the behavior-tree tests.

## 2. Verification commands and baseline (all verified 2026-11-10)

| Command | Baseline result |
|---|---|
| `npx tsc -b --pretty false` | exit 0 |
| `npm run lint` | exit 0, 1 warning: `usePlayerInput.ts:121` react-hooks/exhaustive-deps (missing `state` dep) |
| `npx vitest run` | 11/11 pass (pathfinding 5, herotree 6) |
| `node scripts/verify-dungeon.mjs` | 500/500 seeds pass |
| `npm run build` | exit 0; JS bundle 3,611.97 kB raw / 1,213.91 kB gzip; sass legacy-js-api deprecation warning; chunk >500 kB warning |

After every task, `npx tsc -b --pretty false`, `npm run lint`, and `npx vitest run` must pass with no new warnings. Tasks that touch rendering also need the browser check listed in the task.

## 3. File map (abridged)

```
src/
├── main.tsx                  # Entry: StrictMode + createRoot
├── App.tsx                   # Canvas + UI composition, KeyboardControls provider
├── components/
│   ├── Effects.tsx           # Post pipeline (TiltShift, Dither, Noise, Vignette)
│   ├── hero/Hero.tsx         # Hero: physics body, KCC movement, AI step, camera, model (417 lines)
│   ├── hero/TorchLight.tsx   # Spotlight + flame meshes
│   ├── hero/useTorchFlicker.ts
│   ├── dungeon/              # Instanced floor/walls, colliders, pedestal
│   ├── physics/GamePhysics.tsx # Rapier <Physics> wrapper
│   ├── scene/                # IsometricCamera, Lighting
│   └── debug/                # Dev overlay, frame stats
├── game/
│   ├── constants.ts          # World units (FLOOR_SIZE, gravity, timestep)
│   ├── ecs.ts                # miniplex world + entity factories
│   ├── store.ts              # Zustand UI state
│   ├── pathfinding.ts        # NavGraph over floor cells (ngraph A*)
│   ├── ai/HeroTree.ts        # Behavior tree (Mistreevous)
│   └── dungeon/              # Pure seeded generation modules
├── hooks/usePlayerInput.ts   # Keyboard+gamepad input, manual/auto idle timer
├── styles/                   # SCSS globals + design tokens
└── types/index.ts            # All shared types
tests/
├── pathfinding.test.ts       # 5 tests
└── herotree.test.ts          # 6 tests
scripts/verify-dungeon.mjs    # Headless 500-seed dungeon verifier
```

## 4. Tasks

Status legend: `[ ]` open, `[x]` done.

### T1. Remove broken `/vite.svg` icon reference (404 on every page load)

- **Priority:** P1 (user-visible console error; project contract is zero console errors)
- **Status:** [x]
- **Files:** `index.html` (line 5), `public/manifest.json` (line 12)
- **Current behavior:** `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` points at `/vite.svg`, but `public/` contains no `vite.svg` (only favicon.ico, favicon-16x16.png, favicon-32x32.png, android-chrome-*, apple-touch-icon.png, manifest.json, og-image.png). The browser 404s on every load.
- **Expected behavior:** No 404s; the favicon keeps working via the existing `.ico`/PNG entries.
- **Fix:** Delete line 5 of `index.html` (the `vite.svg` link). Do not touch the other icon links. Also replace the single `/vite.svg` icon entry in `public/manifest.json` with the existing `android-chrome-192x192.png` and `android-chrome-512x512.png` entries (scope extension approved during execution).
- **Verify:** `npm run dev`; open the app; DevTools Network tab shows no 404s; Console is empty. `npm run build` still passes.
- **Notes:** If the user wants a real SVG favicon instead, that is a separate asset task — ask first.

### T2. Pixel font is referenced but never loaded (CSP would block it)

- **Priority:** P1 (visual: the whole UI renders in the fallback font)
- **Status:** [x]
- **Files:** `src/styles/_variables.scss` (line 11), `index.html` (lines 24–26), `src/styles/global.scss` (line 14)
- **Current behavior:** `--font-pixel: 'Press Start 2P', system-ui, monospace;` is applied to `body`, but the font is never loaded: `index.html` preconnects to `fonts.googleapis.com`/`fonts.gstatic.com` without a stylesheet link, and the CSP (`style-src 'self' 'unsafe-inline'`) would block a Google Fonts CSS even if added. Result: everything renders in `system-ui`/`monospace`; the preconnects are dead weight.
- **Expected behavior:** The pixel font actually renders, or the token is changed to a font that is present.
- **Fix (user chose Option A — self-host; executed):**
  - **Option A (recommended): self-host.** Download the 'Press Start 2P' woff2 (Google Fonts, OFL license), put it in `public/fonts/`, add an `@font-face` in `global.scss`, delete the two preconnect lines, tighten CSP `font-src` to `'self' data:`.
  - **Option B: load from Google Fonts.** Add `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" crossorigin>` and extend CSP `style-src` with `https://fonts.googleapis.com` (font-src already allows `fonts.gstatic.com`).
  - **Option C: drop the pixel font.** Change `--font-pixel` to a monospace stack and delete the preconnects.
- **Verify:** `npm run dev`; DevTools Computed styles on the badge show the intended family; no CSP errors in Console; Network shows the font loading (A/B) or no external requests (C).
- **Notes:** `src/styles/*` is protected — this task is the explicit exception.

### T3. Idle timeout mismatch: README says 4 seconds, code says 10

- **Priority:** P1 (behavior vs documented contract)
- **Status:** [x]
- **Files:** `src/hooks/usePlayerInput.ts` (line 26: `IDLE_TIMEOUT_MS = 10000`), `README.md` ("go idle for four seconds and the AI takes right back")
- **Current behavior:** The hero flips back to auto mode after 10,000 ms without input; the README documents 4 seconds.
- **Expected behavior:** One value, code and docs agreeing.
- **Fix (decision needed — ask the user):** Set `IDLE_TIMEOUT_MS` to the agreed value (4000 to match the README is the likely answer) and keep the constant's doc comment accurate.
- **Verify:** `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`; `npm run dev` → stop pressing keys and time the flip back to auto (hero resumes wandering) at the agreed value.

### T4. `npm test` runs vitest in watch mode and never exits

- **Priority:** P2 (developer experience)
- **Status:** [x]
- **Files:** `package.json` (line 11: `"test": "vitest"`)
- **Current behavior:** `npm test` starts vitest in watch mode and never exits, which breaks CI and scripted verification.
- **Expected behavior:** `npm test` runs the suite once and exits with the proper code.
- **Fix:** Change the script to `"test": "vitest run"`.
- **Verify:** `npm test` completes and exits 0 (11/11).

### T5. Decouple the behavior tree from the Zustand store

- **Priority:** P1 (architecture: the AI module imports React-store code)
- **Status:** [ ]
- **Files:** `src/game/ai/HeroTree.ts` (line 9 import, lines 187 and 199), `src/components/hero/Hero.tsx` (the `createHeroTree(...)` call in the `useMemo`), `tests/herotree.test.ts`
- **Current behavior:** The `interact` action writes to the store directly: line 187 `useGameStore.getState().setHasKey(true)` and line 199 `useGameStore.getState().descendToNextLevel()`. `HeroTree.ts` imports `useGameStore` from `../store`; the tests import the store and assert on its state (`useGameStore.getState().hasKey`, `.currentDepth`).
- **Expected behavior:** `createHeroTree` is pure with respect to React: it receives event callbacks and never imports the store. The store stays the canonical HUD state; the hero component wires the callbacks to it.
- **Fix:**
  1. In `HeroTree.ts`, add an exported `HeroTreeEvents` interface with `onKeyPickedUp: () => void` and `onDescend: () => void`. Add a 5th parameter `events: HeroTreeEvents` to `createHeroTree` (no default — call sites must pass it). Replace the two `useGameStore.getState()` calls with `events.onKeyPickedUp()` / `events.onDescend()`. Delete the `useGameStore` import.
  2. In `Hero.tsx`, pass `{ onKeyPickedUp: () => useGameStore.getState().setHasKey(true), onDescend: () => useGameStore.getState().descendToNextLevel() }` at the `createHeroTree` call site (Hero.tsx already imports the store).
  3. In `tests/herotree.test.ts`, pass recording callbacks (e.g. `let keyPickedUp = 0; let descended = 0;`) at every `createHeroTree` call (via `makeSim`), and replace store assertions with callback-count assertions: the "picks up the key" test asserts `keyPickedUp === 1`; the "walks to the key, then descends" test asserts `descended === 1` (and `keyPickedUp === 1`). Drop `resetStore()` and the `useGameStore` import.
- **Verify:** `npx vitest run` (11/11), `npx tsc -b --pretty false`, `npm run lint`. Browser: `npm run dev` — no POIs are spawned yet (Step 6), so key/stairs behavior is test-only; confirm the app still runs and the hero wanders.
- **Notes:** Do not change the store's `descendToNextLevel` implementation (it also resets `hasKey` and forces auto mode — that stays).

### T6. Split `Hero.tsx` (417 lines — violates the 200-line rule)

- **Priority:** P1 (`.cursorrules`: "No single file may exceed 200 lines")
- **Status:** [ ]
- **Files:** `src/components/hero/Hero.tsx` (split into new files in the same folder)
- **Current behavior:** One component owns: the `RigidBody` + character-controller lifecycle, input sampling, direction resolution, AI tree step, heading damp, walk-cycle bob/squash, cinematic camera follow, ECS mirror, and the ~120-line `HeroModel` JSX.
- **Expected behavior:** Focused modules, each under 200 lines, with identical runtime behavior (no visual or physics change).
- **Fix (recommended structure):**
  - `HeroModel.tsx` — the existing `HeroModel` function (pure JSX, takes the two refs it needs).
  - `useHeroFrame.ts` (or similar) — one hook that owns the single `useFrame` loop and receives the refs it drives; keep the existing step order (1. input/AI → 2. heading → 3. walk cycle → 4. camera → 5. ECS mirror) and the allocation-free scratch vector.
  - Keep in `Hero.tsx`: the refs, the character-controller effect, the `navGraph`/`ai` memos, the ECS registration effect, and the `RigidBody` JSX composing the extracted pieces.
  - If any extracted file exceeds 200 lines, split further (e.g. camera follow into its own hook).
- **Constraints:** No behavior change; no per-frame allocations; heading stays in a single ref used by both the model and the torch anchor; the character-controller effect keeps its current create-on-mount / free-on-cleanup shape.
- **Verify:** `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`; every file under 200 lines; `npm run dev` → visual A/B: movement, wall sliding, walk bob/squash, camera look-ahead, torch all identical to before.

### T7. Add an Error Boundary around the app

- **Priority:** P1 (a render/physics error currently unmounts the whole app to a white screen)
- **Status:** [ ]
- **Files:** `src/components/debug/ErrorBoundary.tsx` (new), `src/main.tsx`
- **Current behavior:** `main.tsx` renders `<StrictMode><App /></StrictMode>` with no boundary; any thrown render error (including from inside the Canvas) kills the whole UI.
- **Expected behavior:** A thrown render error shows a readable fallback (message + reload button) instead of a white screen.
- **Fix:** Add a small class component `ErrorBoundary` (static `getDerivedStateFromError`, optional `componentDidCatch` console.error) with a minimal styled fallback (reuse `global.scss` tokens; no new dependencies). Wrap `<App />` in `main.tsx` inside `StrictMode`.
- **Verify:** `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`; `npm run dev` → app loads normally; (manual check) temporarily throw inside a component in dev to confirm the fallback renders, then revert.

### T8. `usePlayerInput`: module-level idle timestamp → ref, and fix the lint warning

- **Priority:** P2 (hygiene + testability; current code works)
- **Status:** [ ]
- **Files:** `src/hooks/usePlayerInput.ts` (line 32 `let lastInputTime`, line 121 `useCallback` deps)
- **Current behavior:** `lastInputTime` is a module-level `let` (intentional, per the comment, to survive re-renders and stay out of the store). It is shared across React roots/HMR reloads. Lint reports `useCallback has a missing dependency: 'state'` at line 121.
- **Expected behavior:** The timestamp lives in a `useRef` (still survives re-renders, per-instance, StrictMode-safe) and lint is clean.
- **Fix:** Replace the module-level `let` with `const lastInputTimeRef = useRef(performance.now());` inside the hook; read/write `lastInputTimeRef.current` in `sample()`. Add `state` to the `useCallback` dependency array (it is a stable ref-backed object, so the callback is not recreated). Update the module-level doc comment accordingly.
- **Verify:** `npx tsc -b --pretty false`, `npm run lint` (0 warnings), `npx vitest run`; `npm run dev` → manual input flips to auto, and the idle timeout flips back to auto.

### T9. Hero ECS registration effect ignores the `position` prop

- **Priority:** P2 (one-frame ECS staleness on depth change; self-corrects)
- **Status:** [ ]
- **Files:** `src/components/hero/Hero.tsx` (the `useEffect` that calls `createHero(`, with the `eslint-disable-next-line react-hooks/exhaustive-deps` comment)
- **Current behavior:** The effect creates the ECS hero entity once with `[]` deps at the initial spawn. When depth changes, the `position` prop changes and the `RigidBody` teleports via its prop, but the entity keeps the old spawn for one frame (the per-frame ECS mirror then corrects it).
- **Expected behavior:** The entity is recreated at the new spawn whenever the `position` prop changes; no eslint-disable.
- **Fix:** Depend on the spawn coordinates, not the array: destructure `const [spawnX, spawnY, spawnZ] = position;` and use `[spawnX, spawnY, spawnZ]` as the effect deps. Keep the cleanup (`world.remove`) as is.
- **Verify:** `npx tsc -b --pretty false`, `npm run lint` (no new warnings), `npx vitest run`; `npm run dev` → trigger a depth change and confirm the hero appears at the new spawn with no one-frame ghost.
- **Notes:** An alternative is a second effect that syncs `entity.position` when the prop changes — but recreation matches the documented intent ("entity is created at the same spawn").

### T10. Reconcile `docs/steps/INDEX.md` Step 5 checkboxes with the code

- **Priority:** P2 (docs accuracy for future handoffs)
- **Status:** [ ]
- **Files:** `docs/steps/INDEX.md`
- **Current behavior:** Step 5 micro-steps are mostly `[ ]` even though the code implements the hero, torch, behavior tree, character-controller movement, WASD override, pathfinding, POI interaction, and both test files.
- **Expected behavior:** Checkboxes reflect reality: implemented micro-steps are `[x]`; genuinely incomplete ones (e.g. stuck recovery, final acceptance) stay `[ ]` with a note.
- **Fix:** Walk the Step 5 section micro-step by micro-step against the current source; tick what is implemented; leave the rest unchecked. Do not rewrite the step docs themselves.
- **Verify:** Re-read the section: every ticked item is backed by code the reviewer can point to; no code change is required (`npx tsc -b --pretty false` still passes).

### T11. Commit the in-flight working-tree changes

- **Priority:** P1 (hygiene; blocks clean per-task commits)
- **Status:** [x]
- **Files:** (working tree — no code change)
- **Current behavior:** Uncommitted changes exist: `AI_HANDOFF.md`, `src/components/hero/Hero.tsx`, `src/components/hero/TorchLight.tsx`, `src/components/hero/useTorchFlicker.ts` (camera look-ahead + torch tweaks), plus untracked `CODE_REVIEW.md`.
- **Expected behavior:** A clean working tree before task work begins.
- **Fix (user decision — ask first):** Either commit the in-flight work with a short message (e.g. `feat: cinematic camera look-ahead and torch polish`) or handle it as the user directs. Do not commit silently.
- **Verify:** `git status` shows a clean tree (or the agreed state).

### T12. Performance budget: DPR cap, multisampling, shadow maps (measure first)

- **Priority:** P2 (measure, then change only what hurts)
- **Status:** [ ]
- **Files:** `src/App.tsx` (line 49 `dpr={[1, 2]}`), `src/components/Effects.tsx` (line 22 `multisampling={4}`), `src/components/scene/Lighting.tsx` (lines 15–16, 2048² directional), `src/components/hero/TorchLight.tsx` (lines 26–27, 512² spotlight)
- **Current behavior:** On a 2x-DPR display the scene renders at 2x resolution, then runs four post effects with MSAA 4, plus two shadow maps per frame (2048² + 512²).
- **Expected behavior:** Frame time within budget with no visible quality loss.
- **Fix (in order, only if the stats justify it):**
  1. Open the dev overlay frame stats and record the baseline frame time.
  2. If frame time is high: try `dpr={[1, 1.5]}` first (cheapest win on hi-DPI displays).
  3. Still high: set `multisampling={0}` — the dither/tilt-shift pipeline already hides aliasing; verify visually.
  4. Still high: drop the directional shadow map to 1024² (the diorama is small; 2048 is likely overkill). Keep the spotlight at 512².
- **Verify:** Dev overlay frame stats before/after; visual check of shadows (no acne/aliasing) and the tilt-shift/dither look.
- **Notes:** Do not change values that the stats say are fine. Report the numbers either way.

### T13. Bundle size audit (1.21 MB gzip)

- **Priority:** P3 (informational; no change unless the user wants it)
- **Status:** [ ]
- **Files:** `package.json`, `src/game/pathfinding.ts` (only if replacing ngraph)
- **Current behavior:** `npm run build` produces a single 3,611.97 kB raw / 1,213.91 kB gzip JS chunk (three + rapier WASM + postprocessing dominate). The old review estimated ~650 kB gzip; the real number is ~1.21 MB.
- **Expected behavior:** A written-down understanding of where the weight is, and an optional ngraph replacement.
- **Fix (optional, ask the user):**
  - Document the top bundle contributors using a one-off build probe (do not add a visualizer dependency).
  - Optional: replace `ngraph.graph` + `ngraph.path` with a small deterministic BFS over `floorCells` (the grid is unweighted 4-way; `src/game/dungeon/pathfinding.ts` already has a bounded BFS to model). Preserve the exact route tie-breaks the current tests assert, or update the test expectations deliberately. Then `npm uninstall ngraph.graph ngraph.path`.
- **Verify:** If ngraph is replaced: `npx vitest run` (pathfinding tests), `npm run build` (bundle size delta), `npx tsc -b --pretty false`, `npm run lint`.

### T14. Single source of truth for `GameState`

- **Priority:** P3 (drift risk between two definitions)
- **Status:** [ ]
- **Files:** `src/types/index.ts` (lines 15–30), `src/game/store.ts`
- **Current behavior:** `GameState` is hand-duplicated: an interface in `types/index.ts` and the store implementation in `store.ts`. Changing one without the other is only caught at compile time if the store still satisfies the interface.
- **Expected behavior:** One definition, one import.
- **Fix:** Search the repo for `GameState` first — confirm the only import site is `store.ts`. Then delete the interface from `types/index.ts`, and in `store.ts` switch `create<GameState>()` to an untyped `create(...)` initializer plus `export type GameState = ReturnType<typeof useGameStore>;`. (If the search finds more import sites, report and stop — do not widen the task.)
- **Verify:** `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`; a search for `GameState` shows exactly one definition.
- **Notes:** `src/types/index.ts` is protected — this task is the explicit exception.

### T15. Remove the unused `canvas` devDependency

- **Priority:** P3 (heavy native module, zero imports)
- **Status:** [ ]
- **Files:** `package.json` (line 39: `"canvas": "^3.2.3"`), `package-lock.json`
- **Current behavior:** `canvas` is installed (a native module) but nothing in `src/`, `tests/`, or `scripts/` imports it.
- **Expected behavior:** It is uninstalled; nothing breaks.
- **Fix:** `npm uninstall -D canvas`.
- **Verify:** `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`, `npm run build`.

### T16. Move Hero magic constants to `src/game/constants.ts`

- **Priority:** P3 (discoverability; the constants are documented but local)
- **Status:** [ ]
- **Files:** `src/components/hero/Hero.tsx` (lines 22–62), `src/game/constants.ts`
- **Current behavior:** `SPEED`, `WALK_FREQUENCY`, `WALK_AMPLITUDE`, `WALK_SQUASH_XZ`, `WALK_SQUASH_Y`, `CHARACTER_CONTROLLER_OFFSET`, `INITIAL_HEADING`, `CAMERA_OFFSET`, `LOOK_AHEAD_FACTOR`, `LOOK_AT_LEAD`, `TORCH_ANCHOR` live at the top of `Hero.tsx`.
- **Expected behavior:** They live in `src/game/constants.ts` (the shared world-constants module) with their existing doc comments; `Hero.tsx` imports them.
- **Fix:** Move the constants and their comments; import in `Hero.tsx`. (Do this together with T6 if T6 lands first, so the split files import from `constants.ts` directly.)
- **Verify:** `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`; `npm run dev` → identical behavior.

### T17. `generateDungeon`: graceful degradation instead of a hard throw

- **Priority:** P3 (the verifier proves 500/500 seeds pass today; this is future-proofing)
- **Status:** [ ]
- **Files:** `src/game/dungeon/generateDungeon.ts` (lines 23–31)
- **Current behavior:** `generateDungeon` throws on room-placement or connectivity failure. A future size/config change could brick the game in production.
- **Expected behavior:** A bounded retry: try the seed, then `seed+1` … up to 5 attempts, then throw.
- **Fix:** Wrap the existing body in a retry loop of at most 5 attempts with `seed + attempt`; keep the same error messages (include the attempted seed). Do not change the deterministic layout for a given seed.
- **Verify:** `node scripts/verify-dungeon.mjs` (still 500/500), `npx tsc -b --pretty false`, `npm run lint`, `npx vitest run`.

### T18. Include `tests/` in the TypeScript build

- **Priority:** P3 (type errors in tests only surface at vitest transform time)
- **Status:** [ ]
- **Files:** `tsconfig.json` (line 19: `"include": ["src"]`)
- **Current behavior:** `tsc -b` does not type-check `tests/*.ts`.
- **Expected behavior:** `tsc -b` covers `src` and `tests`.
- **Fix:** Change `include` to `["src", "tests"]`. The tests import `vitest` explicitly (no globals config needed).
- **Verify:** `npx tsc -b --pretty false` (must still exit 0), `npm run build`, `npx vitest run`.
- **Notes:** `tsconfig.json` is protected — this task is the explicit exception; if it surfaces type errors in the tests, fix the tests, not the tsconfig.

### T19. Harden the CSP (audit `unsafe-eval` and dead preconnects)

- **Priority:** P3 (hardening)
- **Status:** [ ]
- **Files:** `index.html` (line 26 CSP meta)
- **Current behavior:** `script-src 'self' 'unsafe-inline' 'unsafe-eval'` is broad; `unsafe-eval` is not needed by the production build (Vite emits static ESM; the React Compiler does not require eval at runtime). The preconnects are dead weight depending on the T2 outcome.
- **Expected behavior:** The narrowest CSP that still works in dev and prod.
- **Fix:** Test removing `'unsafe-eval'` (keep `'unsafe-inline'` for Vite dev injection); if the app works in dev and after `npm run build && npm run preview`, keep the change. Remove preconnects only if T2 chose Option C.
- **Verify:** `npm run dev` (no CSP console errors, HMR works), `npm run build`, `npm run preview` (no CSP console errors).

## 5. Verified non-issues (do not "fix" these)

The previous report flagged these; they were checked against the code and are correct as written:

1. **`KeyboardControls` wrapping `<Canvas>` (`App.tsx:46`) is correct.** Drei's `KeyboardControls` is a plain context provider; the official drei example wraps `<Canvas>` exactly this way. `useKeyboardControls` inside the Canvas reads the context fine. Do not move it inside the Canvas.
2. **`Physics debug={physicsDebug}` does not remount the world.** Toggling the flag adds/removes the debug renderer in place; the Rapier world persists. No memoization needed.
3. **`RapierRigidBody` is a public export** of `@react-three/rapier` (re-exported from `@dimforge/rapier3d-compat`). The old report called it an internal type — incorrect. Keep the type import.
4. **`useGameStore.getState()` inside `useFrame` is idiomatic R3F** for per-frame reads. Not a bug. (T5 is about the AI *writing* to the store, not about reads.)
5. **React 19.3.1 + `babel-plugin-react-compiler@1.0.0`** — both stable; the compiler is an intentional, approved part of the toolchain (README documents why the Babel plugin is used). Do not remove.
6. **`world.createCharacterController()`** — the documented low-level rapier.js API; the effect-based lifecycle (create on mount, free on cleanup) is already StrictMode-safe.
7. **StrictMode + Rapier** — handled: `RigidBody` manages its own handles; the character controller lives in an effect with cleanup. Keep StrictMode.
8. **`navGraph`/`ai` recreated on depth change** — correct and intended (new layout per depth).
9. **`getDungeonLayout` called during `App` render** — cached per seed; cheap.
10. **`miniplex@2.0.0` used directly** — a user-approved decision (AI_HANDOFF 2.3); do not introduce `@miniplex/react`.
11. **Capsule vs cuboid collider** — `docs/steps/05-hero-and-ai/05-04-kinematic-body-and-capsule-collider.md` says capsule, but the implemented design uses the auto-generated cuboid collider from the `RigidBody` collider prop. The code works and tests pass; treat the doc as stale, not the code. (If the user wants a true capsule, that is a new task, not a review fix.)
12. **Sass `legacy-js-api` deprecation warning** — comes from Vite's internal sass integration, not project code. No action without a Vite upgrade (out of scope).
13. **`local-test.txt`** — gitignored scratch file; ignore it.

## 6. Recommended execution order

1. T11 (commit in-flight work — unblocks clean per-task commits)
2. T1 (vite.svg 404)
3. T4 (`npm test` watch mode)
4. T3 (idle timeout — needs the user's 4s/10s decision)
5. T2 (font — needs the user's A/B/C decision)
6. T5 (AI/store decoupling)
7. T9 (ECS entity position effect)
8. T8 (`lastInputTime` ref + lint warning)
9. T7 (Error Boundary)
10. T10 (INDEX.md checkboxes)
11. T6 (Hero.tsx split — do T16 together with it)
12. T12 (perf, measure first)
13. T13 (bundle audit, optional ngraph replacement)
14. T14, T15, T17, T18, T19 (hygiene, any order)

## 7. Completion log

2026-11-10 — T11 done: committed in-flight camera look-ahead + torch polish (70679c0) and the code review work order (f37eaa2); working tree clean.
2026-11-10 — T1 done: removed the /vite.svg link from index.html and replaced the manifest's /vite.svg icon entry with the android-chrome PNGs (approved scope extension); build passes, no vite.svg references remain.
2026-11-10 — T4 done: "test" script changed to "vitest run"; npm test runs the suite once and exits 0 (11/11).
2026-11-10 — T3 done: IDLE_TIMEOUT_MS set to 4000 (user chose the README value); tsc/lint/vitest all pass.
2026-11-10 — T2 done: self-hosted Press Start 2P latin woff2 in public/fonts with @font-face; removed the Google Fonts preconnects; CSP font-src now 'self' data: (user chose option A).

---

## 8. Exact prompt for the next session

Paste this verbatim into the fresh chat:

```text
You are a Senior React Game Engineer working on the Dungeon Dude project in this repository.

Read CODE_REVIEW.md in full first. It is the complete, self-contained work order for the code-review fixes; it contains the project context, the verified baseline, the architecture rules, and the tasks. Follow its "How to use this file" section exactly:

1. Work on exactly ONE task at a time, in the "Recommended execution order" (or the specific task I name).
2. For each task: read its "Current behavior" and "Fix" sections, inspect the listed source files, implement the fix, run every command in its "Verify" section, and report the exact result of each command.
3. Do not start the next task until I explicitly approve the current one.
4. When I approve, tick the task's checkbox in CODE_REVIEW.md, append a one-line dated entry to its "Completion log", and commit only the files that task changed with a short message. Report the commit hash.
5. If a task's instructions conflict with the actual code, stop and report the conflict instead of guessing.
6. Do not add dependencies. Do not edit files outside a task's "Files" list unless the task says otherwise. Do not change game behavior beyond what the task specifies.
7. Tasks marked "decision needed" require my explicit choice before you implement them — present the options and wait.

Start with the first unchecked task in the recommended order. Before writing any code, tell me which task you are starting and confirm the plan in one or two sentences.
```

