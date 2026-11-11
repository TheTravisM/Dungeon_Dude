# 05-09 Path smoothing

**Type:** LOGIC (tested)
**Depends on:** 05-08 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 3, and 7 only.

## Goal

Cell-by-cell paths make a stair-stepping hero. Reduce them to a few straight legs so movement looks purposeful, while never cutting a wall corner.

## Create

1. `src/game/hero/navigation/smoothPath.ts`:
   ```ts
   export function hasClearLine(grid: WalkGrid, a: WorldPoint, b: WorldPoint, clearance: number): boolean
   export function smoothPath(grid: WalkGrid, start: WorldPoint, points: WorldPoint[], clearance?: number): WorldPoint[]
   ```
   - `hasClearLine`: sample the segment every 0.1 world units; at each sample check the four points offset by `clearance` along the axes (`+-clearance` in x and z) against the grid (`worldToGrid` then `isWalkable`). Any blocked sample means not clear. Default clearance is `HERO_PATH_CLEARANCE` (0.32).
   - `smoothPath`: classic string pulling by greedy line of sight. From the current anchor (starting at `start`), find the farthest later point with a clear line, emit it, move the anchor there, repeat until the last point. The final point is always the original goal. Result never contains the start. Empty input returns empty.
   - Keep all helpers pure and allocation-light; paths are short.
2. `src/game/hero/navigation/smoothPath.test.ts` (Vitest). Build small grids by hand (a helper that makes a `WalkGrid` from an ASCII map) and also use real layouts:
   - Open room: a diagonal across an open room collapses to one or two points.
   - Corridor with an L-corner: the smoothed path keeps the corner point and does not cut it.
   - One-tile doorway: the path passes through the center of the doorway cell (the line must not clip the doorway frame).
   - Property test over seeds 1 to 50: for every route from `rooms[0].center` to every other room center, every segment of the smoothed path has `hasClearLine === true`, the final point equals the goal, and smoothing never produces more points than the input.
   - Total smoothed length is never longer than the raw cell path length plus 0.001.

## Spec notes

- Clearance 0.32 against a hero radius of about 0.30 (radius plus offset) keeps a small margin. If the property test passes but the hero still scrapes corners in the browser (checked in 05-12), raise `HERO_PATH_CLEARANCE` to 0.35 in the constants; do not change the algorithm.
- One-tile corridors cannot satisfy a clearance of 0.5, so keep the check as written: it samples neighbor points at `+-clearance`, which is satisfied inside a centered one-tile corridor because the neighbors at 0.32 are still inside the corridor's own cell.

## Acceptance

- [ ] `npm test` passes all new tests.
- [ ] The property test covers 50 seeds and every room.
- [ ] No React or Three imports in these files; each stays under 200 lines.
- [ ] The standard verification commands pass.

## Not in this task

Following the path (5.12), drawing it (5.10).
