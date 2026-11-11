# 05-08 Navigation grid and path planning

**Type:** LOGIC (tested)
**Depends on:** 05-07 approved. (Pure logic; no browser check.)
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 1, 2, and 5 only.

## Goal

A thin, tested wrapper over the existing `findGridPath` so the hero can plan routes between world positions on the generated layout. We reuse existing code; we do not add a pathfinding library.

## Inspect first

`src/game/dungeon/pathfinding.ts` (`findGridPath({ size, start, goal, canEnter, directions? })` returns `GridCell[] | null`; check whether the returned path includes the start cell and handle it once, in this task), `src/game/dungeon/constants.ts` (`gridToWorld`, `DUNGEON_SIZE`), `src/game/dungeon/rectangles.ts` (`createCellMask`), `scripts/verify-dungeon.mjs` (how the project tests layouts).

## Create and edit

1. `src/game/dungeon/constants.ts`: add next to `gridToWorld`:
   ```ts
   export function worldToGrid(coordinate: number, size: number = DUNGEON_SIZE): number {
     return Math.round(coordinate + (size - 1) / 2);
   }
   ```
2. `src/game/hero/navigation/walkGrid.ts`:
   ```ts
   export interface WalkGrid { size: number; isWalkable(x: number, z: number): boolean }
   export function createWalkGrid(layout: DungeonLayout): WalkGrid
   ```
   Build once from `createCellMask(layout.floorCells, layout.size)`. Out-of-bounds is not walkable. Cache by `${seed}:${size}` like the other dungeon modules.
3. `src/game/hero/navigation/heroPath.ts`:
   ```ts
   export interface WorldPoint { x: number; z: number }
   export function planGridPath(grid: WalkGrid, from: GridCell, to: GridCell): GridCell[] | null
   export function planWorldPath(layout: DungeonLayout, from: WorldPoint, to: WorldPoint): WorldPoint[] | null
   ```
   `planGridPath` calls `findGridPath` with `canEnter: grid.isWalkable`. `planWorldPath` converts with `worldToGrid`, plans, and returns cell-center world points via `gridToWorld`, EXCLUDING the start cell and INCLUDING the goal cell. Start equal to goal returns `[]`. A non-walkable start or goal returns `null` (do not silently snap).
4. `src/game/hero/navigation/heroPath.test.ts` (Vitest, node): build layouts with `generateDungeon(seed)` for at least seeds 1, 2, 3, 42, 1337 (and a loop over seeds 1 to 50 for the connectivity case). Cases:
   - Round trip: `gridToWorld` then `worldToGrid` returns the same cell for every cell in a layout.
   - Every room center is reachable from `rooms[0].center`, for every seed tested.
   - Every returned step moves exactly one cell in one cardinal direction and every cell is walkable.
   - Path length is at least the Manhattan distance and the path is deterministic (same inputs, same output).
   - A wall cell as goal returns `null`. Start equals goal returns `[]`.
   - Returned world points are cell centers (coordinates end in `.5` for an even-sized grid, per `gridToWorld`).

## Acceptance

- [ ] `npm test` passes the new tests.
- [ ] No new dependency was added; `findGridPath` is the only search used.
- [ ] `walkGrid.ts` and `heroPath.ts` import no React or Three code.
- [ ] `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, `node scripts/verify-dungeon.mjs`, `git diff --check` pass.

## Not in this task

Smoothing the path, following it, a debug view, goals.
