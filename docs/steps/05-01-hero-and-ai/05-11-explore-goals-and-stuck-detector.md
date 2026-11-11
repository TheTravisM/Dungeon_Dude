# 05-11 Explore goals and stuck detector

**Type:** LOGIC (tested)
**Depends on:** 05-10 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 3, and 4 only.

## Goal

Two pure modules the brain will call: which room to visit next, and whether the hero has stopped making progress. No React, no Three, no timers inside them.

## Inspect first

`src/game/dungeon/random.ts` (`createRandom(seed)` gives `{ next, int, chance, pick }`), `src/types/index.ts` (`DungeonRoom`, `DungeonLayout`), `src/game/hero/navigation/heroPath.ts` (`planWorldPath`), `src/game/hero/constants.ts`.

## Create

1. `src/game/hero/ai/exploreGoals.ts`:
   ```ts
   export interface ExploreState { visited: Set<number>; lastGoalRoom: number | null }
   export function createExploreState(): ExploreState
   export function roomIndexAt(layout: DungeonLayout, p: WorldPoint): number | null  // room containing the point, else null
   export function markVisited(state: ExploreState, roomIndex: number): void
   export function pickNextRoom(layout, grid, state, from: WorldPoint, rng: RandomSource): number | null
   export function pickWanderCell(grid: WalkGrid, layout, from: WorldPoint, rng: RandomSource): GridCell | null
   ```
   - `pickNextRoom`: among unvisited rooms, choose the one with the shortest planned path from `from` (use `planWorldPath` lengths; ties broken by `rng.pick` over the tied set). If every room is visited, clear `visited` except the current room and start a new sweep (the game runs forever). Never return the room the hero is currently in unless it is the only room. Return `null` only when no room is reachable.
   - `pickWanderCell`: a random walkable cell at least 4 cells away; used as the last-resort goal after repeated failures.
   - Deterministic: same layout, state, and rng seed give the same sequence.
2. `src/game/hero/ai/stuckDetector.ts`:
   ```ts
   export type StuckLevel = 0 | 1 | 2 | 3;   // 0 ok, 1 replan, 2 pick another goal, 3 snap to cell center
   export interface StuckDetector {
     sample(nowMs: number, pos: WorldPoint, wantsToMove: boolean): StuckLevel;
     reset(nowMs: number, pos: WorldPoint): void;
   }
   export function createStuckDetector(windowMs?: number, minProgress?: number): StuckDetector
   ```
   - Once per `HERO_STUCK_WINDOW_MS`, compare the position with the one at the window start. If `wantsToMove` and distance moved is under `HERO_STUCK_MIN_PROGRESS`, increment a consecutive counter and return `min(counter, 3)`; otherwise reset the counter to 0 and return 0. Between window boundaries return the last level without re-escalating. `reset` clears the counter and starts a new window.
   - `wantsToMove` false (idle, waiting) never counts.
3. Tests (`exploreGoals.test.ts`, `stuckDetector.test.ts`):
   - Explore: over seeds 1 to 50, a loop calling `pickNextRoom` then `markVisited` visits every room exactly once before any repeat; the sequence is deterministic for a fixed rng seed; `pickNextRoom` returns `null` only for an unreachable case (build one by hand with an unreachable room); a new sweep starts after the last room.
   - `roomIndexAt` returns the right room for room centers and `null` for a corridor cell.
   - Stuck: no movement for 1 window gives level 1, 2 windows give level 2, 3 or more give level 3 and stay 3; moving normally returns 0; `wantsToMove=false` stays 0; `reset` returns to 0; the level does not escalate more than once per window.

## Acceptance

- [ ] `npm test` passes the new tests.
- [ ] No imports from React, Three, Zustand, or Rapier in these files.
- [ ] No `Math.random`; only the supplied `rng`. No `Date.now` or `performance.now` inside the modules; time comes in as `nowMs`.
- [ ] Standard verification commands pass; each file is under 200 lines.

## Not in this task

Calling these from the game loop (5.13).
