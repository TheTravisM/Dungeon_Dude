# 05-05 Character-controller movement

**Type:** CODE / PHYSICS
**Depends on:** 05-04 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 3, 4, 6.1, 6.2, 6.3, and 7 only.

## Goal

Manual movement: WASD or arrows or a pad moves the hero along screen directions, sliding along walls, never through them. The hero entity's position and velocity stay current for later tasks.

## Inspect first

`src/components/hero/Hero.tsx`, `src/game/hero/isoMovement.ts`, `src/game/hero/input/inputState.ts`, `src/game/ecs.ts`, `src/components/physics/GamePhysics.tsx` (fixed step, interpolation on).

## Create and edit

1. `src/hooks/hero/useHeroMovement.ts`:
   ```ts
   export function useHeroMovement(
     bodyRef: RefObject<RapierRigidBody | null>,
     colliderRef: RefObject<RapierCollider | null>,
     getDesiredDirection: (nowMs: number) => { x: number; z: number }
   ): void
   ```
   - `const { world } = useRapier()`. Create the controller once in a `useEffect` (`world.createCharacterController(HERO_CONTROLLER_OFFSET)`), configure it per contract 6.1 (slide on, autostep off, snap off, no impulses), store it in a `useRef`, and remove it with `world.removeCharacterController` in cleanup. StrictMode safe.
   - `useBeforePhysicsStep(() => { ... })`: guard null refs and a missing controller. Read `dir = getDesiredDirection(performance.now())`. `delta = dir * HERO_SPEED * PHYSICS_TIME_STEP`. Call `controller.computeColliderMovement(collider, { x: delta.x, y: 0, z: delta.z })`, read `computedMovement()`, then set `body.setNextKinematicTranslation({ x: t.x + m.x, y: FLOOR_TOP, z: t.z + m.z })` where `t = body.translation()`.
   - After setting the target, update the ECS hero (`heroQuery.first`): `position` to the new target, `velocity` to `(m.x, 0, m.z) / PHYSICS_TIME_STEP`, and `heading = Math.atan2(dir.x, dir.z)` only when `dir` is nonzero. Mutate existing Vector3s with `.set`, never replace them.
   - Reuse module-level scratch objects for the translation argument so the step allocates nothing beyond what Rapier returns.
2. `src/components/hero/Hero.tsx`: wire the refs (declared in 05-01 or add now), call `useHeroMovement(bodyRef, colliderRef, manualDirection)` where `manualDirection = (now) => isManualNow(now) ? axesToWorldDirection(inputState.axes) : { x: 0, z: 0 }`. The auto branch is added in 05-12; leave a one-line comment marking the spot. Keep the visual untouched.

## Spec notes

- The hero is a kinematic body; collisions with static colliders come only from the controller. Do not give the hero dynamic physics.
- Do not use `setTranslation` per frame; `setNextKinematicTranslation` is what makes interpolation work.
- If the hero snags on a floor seam, follow contract section 7 (raise clearance to 0.03). Do not write custom collision code.
- If it slides oddly in a corridor corner, check that `HERO_RADIUS + HERO_CONTROLLER_OFFSET` is 0.30 or less before changing anything else.

## Acceptance

- [ ] W moves up the screen, D to the right, S down, A left, diagonals work and are not faster than straight lines.
- [ ] Pushing into a wall slides along it and never passes through, including at room corners and doorways.
- [ ] Walking the full length of a one-tile corridor with W/D or a diagonal does not snag.
- [ ] The hero stays at `y = FLOOR_TOP` and cannot step onto the low wall ledges.
- [ ] Motion looks smooth at 60 and at 144 Hz (interpolation on; the model is a child of the body).
- [ ] `heroQuery.first.position` and `velocity` update; there is no allocation per step beyond Rapier's own.
- [ ] Hot reload and StrictMode do not leave two controllers (log `world.numCharacterControllers` if available, otherwise confirm by code review).

## Verify

INDEX commands, then browser: walk to every wall type, a corridor, and a corner with the Physics colliders overlay on. Ask the user to confirm the feel.

## Not in this task

Facing the model, animation, camera follow, autonomous movement.
