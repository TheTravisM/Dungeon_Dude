# 05-13 Behavior-tree brain and autonomous exploration

**Type:** CODE / AI
**Depends on:** 05-12 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 1, 4, 6.4, and 7 only.

## Goal

The hero plays itself: picks the next room, plans a route, follows it, recovers from being stuck, and starts again, forever, with no input. Built on `mistreevous` and the pure modules from 5.08 to 5.12.

## Inspect first

`src/game/hero/ai/exploreGoals.ts`, `stuckDetector.ts`, `src/game/hero/navigation/*`, `src/game/hero/intent.ts`, `src/hooks/hero/useHeroMovement.ts`, `src/game/dungeon/random.ts` (`createRandom`), `src/game/ecs.ts`.

## Create and edit

1. `src/game/hero/ai/heroBrain.ts`: no React.
   ```ts
   export function createHeroBrain(layout: DungeonLayout, getPosition: () => WorldPoint, requestSnap: () => void): {
     tick(nowMs: number): void;
     onManualTakeover(nowMs: number): void;
   }
   ```
   - Seeded `rng = createRandom(layout.seed ^ 0x9e3779b9)`; `grid = createWalkGrid(layout)`; `explore = createExploreState()`; `stuck = createStuckDetector()`.
   - Tree (MDSL string; keep it as a named const at the top of the file so Step 6 to 9 can extend it):
     ```
     root {
       selector {
         sequence {
           condition [HasRoute]
           action [TrackRoute]
         }
         action [PlanNext]
       }
     }
     ```
     Pass `{ random: () => rng.next() }` as the tree options.
   - Agent methods (behavior verified in 05-00 tests):
     - `HasRoute()`: `routeState.points.length > 0`.
     - `TrackRoute()`: sample the stuck detector with `wantsToMove = true`. Level 0: return `State.RUNNING`. Level 1: replan to the current goal and return `State.RUNNING`. Level 2: return `State.FAILED` after setting a flag that makes `PlanNext` pick a different room. Level 3: call `requestSnap()`, `clearRoute()`, `stuck.reset`, return `State.FAILED`. When the route is empty, mark the goal room visited via `roomIndexAt` and return `State.SUCCEEDED`.
     - `PlanNext()`: pick a room (or `pickWanderCell` if the last two plans failed), `planWorldPath`, `smoothPath`, `setRoute(points, goal)`, `stuck.reset`, and return `State.SUCCEEDED` if a route exists, else `State.FAILED`. After three consecutive failures, wander.
   - `tick(now)`: `tree.step()`.
   - `onManualTakeover(now)`: `tree.reset()`, `clearRoute()`, `stuck.reset`. The tree is not stepped while manual (see the hook).
   - Because `mistreevous` only revisits the running leaf, manual mode is handled outside the tree, as above.
2. `src/hooks/hero/useHeroBrain.ts`: `useHeroBrain(layout)`:
   - Creates the brain once per layout in `useMemo`/`useEffect` (StrictMode safe, no leaks).
   - `useFrame` accumulates delta; every `1 / HERO_BRAIN_HZ` seconds: if `isManualNow(now)` then (on the first manual tick only) `onManualTakeover`, else `tick(now)`. Never step the tree every frame.
   - Brain start: the first tick happens right after mount, so the hero moves with no input.
3. `src/hooks/hero/useHeroMovement.ts`: add a small exported `requestSnapToCell()` and an internal flag; in the next physics step when set, call `body.setTranslation` to the center of the hero's current grid cell (`gridToWorld(worldToGrid(...))`, `y = FLOOR_TOP`) and clear the flag. This is the last-resort recovery only.
4. `src/components/hero/Hero.tsx`: call `useHeroBrain(layout)`; pass `requestSnapToCell` into the brain factory.
5. Import check: `import { BehaviourTree, State } from 'mistreevous'` must work under Vite dev and the production build. If the named import fails because it is a CommonJS package, use default-import interop (`import mt from 'mistreevous'; const { BehaviourTree, State } = mt;`), keep a typed wrapper, and report it.

## Spec notes

- Per-frame data is untouched; the brain writes only `routeState` (module) and calls store actions through the input module. Do not add Zustand writes here.
- When route points are consumed by `resolveHeroDirection`, `TrackRoute` sees an empty route and returns `SUCCEEDED`; the next tick starts `PlanNext`. At 5 Hz that means a pause of at most 0.2 seconds at each room, which is the desired natural beat.
- Do not add combat, chests, or doors. Step 6 and later add branches.

## Acceptance

- [ ] On page load, with no input, the hero walks to the nearest unvisited room, then the next, visiting every room, and then starts another sweep.
- [ ] The path overlay shows the live route; pressing a key takes over instantly, and 4 seconds after releasing, the hero resumes exploring from where it is.
- [ ] The hero is never stuck for more than about 3 seconds; if forced stuck (temporarily block with a debug action, then remove it), the recovery levels trigger and it continues.
- [ ] No `console` errors or warnings in dev or the production build (`npm run build` then `npm run preview`).
- [ ] Brain ticks at about 5 Hz (temporary counter, then removed).
- [ ] `mistreevous` imported and working in the browser, not only in tests.

## Verify

INDEX commands, then a browser soak of 5 minutes on two seeds with the path overlay on. Ask the user to confirm the behavior.

## Not in this task

Monsters, fights, chests, keys, doors, stairs, descending, HUD.
