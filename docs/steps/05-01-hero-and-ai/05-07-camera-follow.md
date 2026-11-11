# 05-07 Camera follow

**Type:** CODE / VISUAL
**Depends on:** 05-06 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 6.5, and 7 only.

## Goal

The isometric camera follows the hero smoothly while keeping its exact angle. The hero stays near screen center, which also keeps the future tilt-shift sharp band on the hero.

## Inspect first

`src/components/scene/IsometricCamera.tsx` (offset `(20, 20, 20)`, zoom 40, `lookAt(0,0,0)` in an effect), `src/game/ecs.ts`.

## Create and edit

1. `src/components/scene/CameraFollow.tsx`: renders null, one `useFrame((state, delta) => ...)`:
   - Read `heroQuery.first`; if none, return.
   - Focus target = hero `position` plus a small look-ahead of `velocity * 0.15`, y fixed at `FLOOR_TOP + 0.5`.
   - Smooth a persistent focus Vector3 with `easing.damp3(focus, target, 0.25, delta)`.
   - Set `camera.position` to `focus + CAMERA_OFFSET` where `CAMERA_OFFSET = (20, 20, 20)`, then `camera.lookAt(focus)`. Do not change `camera.zoom` here.
   - On the first frame, snap `focus` to the target so the camera does not fly in from the origin.
   - Use module or `useRef` scratch vectors; allocate nothing per frame.
2. Export `CAMERA_OFFSET` and `CAMERA_ZOOM` from one place (`src/game/constants.ts` or a new `src/components/scene/cameraConstants.ts`), have `IsometricCamera` use them, and remove its fixed `lookAt(0,0,0)` effect since the follow component now owns aim. Keep the DEBUG_ORBIT flag as is.
3. `src/App.tsx`: mount `<CameraFollow />` inside the Canvas. When `DEBUG_ORBIT_CONTROLS` is true, the follow must not fight Orbit: read that flag (export it) and return early.
4. Zoom decision. The hero at zoom 40 is about 42 px tall. Implement `CAMERA_ZOOM = 40` as a single named constant, then ask the user to choose between 40 and about 64 by eye while the hero walks, and set the constant to their choice.

## Spec notes

- The orthographic far plane is 200 with the camera at about 35 units from the focus; moving the focus around a 20 by 20 grid does not break clipping. Leave near and far alone unless something clips.
- Look-ahead and damping must not overshoot or jitter when the hero stops against a wall.

## Acceptance

- [ ] The hero stays near screen center while walking, with a soft lag and a slight lead in the move direction.
- [ ] The camera angle is unchanged (same isometric look as before).
- [ ] No snap on load; no jitter when pressed against a wall.
- [ ] Zoom constant is set to the user's choice and lives in exactly one place.
- [ ] No per-frame allocation.

## Verify

INDEX commands, then browser: walk the whole level and through every doorway. Ask the user for the zoom choice.

## Not in this task

Post-processing, tilt-shift (Step 12 or later), camera bounds.
