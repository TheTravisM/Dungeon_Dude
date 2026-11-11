# 05-12 Waypoint following and mode arbitration

**Type:** LOGIC (tested) + wiring
**Depends on:** 05-11 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 3, 4, and 7 only.

## Goal

The hero can walk a route by itself, and manual input always wins for 4 seconds. Verified in a browser using the Dev-panel route button from 5.10, before any brain exists.

## Inspect first

`src/game/hero/navigation/routeState.ts`, `src/game/hero/input/inputState.ts` (`isManualNow`), `src/hooks/hero/useHeroMovement.ts`, `src/components/hero/Hero.tsx` (the marked auto-branch comment), `src/game/ecs.ts`.

## Create and edit

1. `src/game/hero/navigation/route.ts`:
   ```ts
   export function directionToWaypoint(pos: WorldPoint, waypoints: WorldPoint[], reach?: number): { dir: { x: number; z: number }; arrived: boolean }
   ```
   Pure and mutation-free: drops leading waypoints already within `reach` (default `HERO_WAYPOINT_REACH`) and returns a unit direction to the first remaining one, or zero and `arrived: true` when none remain. The caller shifts the actual `routeState.points` (see item 3) so the tested function stays pure.
   Tests: arrives at the last waypoint, skips a waypoint already within reach, direction is unit length, empty list is `arrived`, never returns NaN for a zero-length vector.
2. `src/game/hero/intent.ts`:
   ```ts
   export function resolveHeroDirection(nowMs: number, pos: WorldPoint): { x: number; z: number }
   ```
   - If `isManualNow(nowMs)`: return `axesToWorldDirection(inputState.axes)` and call `clearRoute()` once on entering manual mode (track a module flag). Auto must never fight manual.
   - Else: read `routeState.points`; use `directionToWaypoint`; remove consumed waypoints from `routeState.points` with a single `setRoute` call per consumption so `version` stays meaningful; return the direction.
   Test the mode rule with the manual clock: manual returns the axes direction; after 4000 ms it follows the route; manual input mid-route clears the route.
3. `src/components/hero/Hero.tsx`: replace the placeholder desired-direction function with `(now) => resolveHeroDirection(now, heroPosition)` where `heroPosition` is read from `heroQuery.first.position` (a scratch object, no allocation).
4. Dev-panel route button from 5.10 stays; it now makes the hero walk.

## Spec notes

- Never aim past a doorway: waypoints are cell centers from 5.09, and smoothing already keeps clearance. If the hero scrapes a corner, raise `HERO_PATH_CLEARANCE` to 0.35 (single constant).
- Do not add a hard stop at the final waypoint beyond arrival; the controller will simply receive a zero direction.

## Acceptance

- [ ] `npm test` passes the new tests.
- [ ] Clicking "Route to random room" makes the hero walk there smoothly with the overlay on, through doorways, without touching walls, on three different seeds.
- [ ] Pressing any movement key mid-route immediately hands control to the player and drops the route; after 4 seconds of no input the hero does not resume on its own (the brain in 5.13 re-plans); it simply stands still.
- [ ] The hero does not orbit or oscillate around the final waypoint.

## Verify

INDEX commands, then browser as above.

## Not in this task

Choosing goals automatically (next).
