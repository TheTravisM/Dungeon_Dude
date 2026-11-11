# 05-10 Path debug overlay

**Type:** DEBUG UI / VISUAL
**Depends on:** 05-09 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 4, and 6.7 only.

## Goal

A dev-only view that draws the hero's current route and goal, so you can watch autonomous behavior and debug stuck cases in later tasks. It must not ship in production.

## Inspect first

`src/components/debug/DebugOverlay.tsx` and `src/game/store.ts` (how `physicsDebug` and the Dev panel toggle work), `src/game/dungeon/constants.ts`.

## Create and edit

1. `src/game/hero/navigation/routeState.ts`: a tiny module singleton with no React:
   ```ts
   export const routeState: {
     points: WorldPoint[];     // remaining smoothed waypoints
     goal: WorldPoint | null;
     version: number;          // increment whenever points or goal change
   };
   export function setRoute(points: WorldPoint[], goal: WorldPoint | null): void
   export function clearRoute(): void
   ```
   Later tasks write it; this task only reads it. Add the single-file unit test `routeState.test.ts` (set, clear, version increments).
2. `src/components/debug/PathDebug.tsx`: renders `null` unless `import.meta.env.DEV` and a new store flag `pathDebug` is on.
   - Store: add `pathDebug: boolean` and `togglePathDebug()` to `src/game/store.ts` and `GameState` in `src/types/index.ts`, initialized from `import.meta.env.VITE_DEBUG_PATH === 'true'`. Add a "Path overlay" checkbox in the Dev panel next to "Physics colliders" following the existing pattern exactly. Add `VITE_DEBUG_PATH` to `.env.example`.
   - Draw with Drei `<Line>`: a polyline from the hero position through `routeState.points` at `y = FLOOR_TOP + 0.05`, color amber, plus a small ring mesh at the goal. Rebuild geometry only when `routeState.version` changes (check in `useFrame`, compare with a ref); the first point follows the hero by updating the line's first vertex, or draws from the first route point to avoid per-frame geometry churn. Choose the simpler approach that allocates nothing per frame.
3. Mount `<PathDebug />` in `App.tsx` inside the Canvas.
4. Temporary manual test: in `PathDebug` (DEV only), on a click of a floor cell, call `planWorldPath` then `smoothPath` then `setRoute`. Skip this if clicking is awkward with the orthographic camera; instead provide a Dev-panel button "Route to random room" that picks a deterministic room by index from `layout.rooms`. Mark it `DEV TOOL`.

## Acceptance

- [ ] With the overlay on, a route drawn from the hero to a chosen room runs through doorways and never crosses a wall.
- [ ] With it off, nothing is rendered and nothing runs per frame.
- [ ] `npm run build` output does not include the debug drawing path when `import.meta.env.DEV` is false (confirm the component returns `null` early; do not add a custom build flag).
- [ ] `.env.example` and the Dev panel entry exist and follow the existing physics-debug pattern.

## Verify

INDEX commands, then browser: toggle the overlay, request a route to three different rooms on two seeds.

## Not in this task

Making the hero follow the route.
