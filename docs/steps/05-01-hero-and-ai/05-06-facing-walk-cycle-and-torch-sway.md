# 05-06 Facing, walk cycle, and torch sway

**Type:** CODE / VISUAL
**Depends on:** 05-05 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 3, 4, and 6.5 only.

## Goal

The hero turns to face where it moves, walks with swinging legs and arm, bobs, and the torch sways with each step. Procedural, no assets, no new dependencies.

## Inspect first

`src/hooks/hero/useHeroRig.ts`, `src/components/hero/HeroModel.tsx`, `src/components/hero/HeroTorch.tsx` (the torch lights must follow the hand), `src/game/ecs.ts`.

## Create and edit

1. `src/hooks/hero/useHeroAnimation.ts`:
   ```ts
   export function useHeroAnimation(rig: HeroRig): void
   ```
   One `useFrame((_, delta) => ...)` reading `heroQuery.first` (guard undefined):
   - **Facing:** `easing.dampAngle(rig.root.current.rotation, 'y', entity.heading ?? 0, 0.08, delta)` (contract 6.5). The `RigidBody` itself is never rotated.
   - **Speed ratio:** `speed = Math.hypot(velocity.x, velocity.z)`; `ratio = Math.min(speed / HERO_SPEED, 1)`.
   - **Phase:** keep a ref `phase`; advance `phase += delta * (4 + 8 * ratio)` only while `ratio > 0.05`. Use a stride of about 9 rad/s at full speed.
   - **Legs:** `legLeft.rotation.x = Math.sin(phase) * 0.7 * ratio`, `legRight.rotation.x = -Math.sin(phase) * 0.7 * ratio`.
   - **Sword arm:** swings opposite the torch side, `armSword.rotation.x = Math.sin(phase + Math.PI) * 0.35 * ratio` (a later step overrides it for attacks).
   - **Bob:** `hips.position.y = 0.50 + Math.abs(Math.sin(phase)) * 0.04 * ratio`.
   - **Torch sway:** `armTorch.rotation.z` and `.x` get a small lateral and fore-aft oscillation tied to `phase` (amplitude about 0.12 rad times ratio), plus a faint idle sway (about 0.03 rad at 1.3 rad/s) when standing still. The lights are children of `torchHand`, so the shadows move with it. Do not touch light intensity here.
   - **Cloak:** `cloak.rotation.x = -0.1 * ratio` so it trails when moving.
   - **Return to idle:** when `ratio` falls, damp the rotations back toward zero with `easing.damp` so the pose never snaps.
   - Reuse refs and numbers; allocate nothing per frame.
2. `src/components/hero/Hero.tsx`: call `useHeroAnimation(rig)` after `useHeroRig()`. No other change.

## Spec notes

- Rotation sign conventions depend on how the model was built in 05-02. If a limb swings the wrong way or the facing is mirrored, fix the sign in this hook, not in the model.
- Facing must match movement: moving toward screen right shows the hero's front facing right, not backward. Verify with all eight directions.
- Because the torch hand is high on the rig, a larger sway makes the shadows swing; keep it subtle.

## Acceptance

- [ ] The hero turns smoothly (no snapping, no long way around at the +/-pi boundary) toward its move direction in all eight directions.
- [ ] Legs alternate, the body bobs, the torch sways and its shadows sway with it.
- [ ] Standing still shows a gentle idle sway and a relaxed pose; stopping blends out, not snaps.
- [ ] No per-frame allocation in the hook; `useHeroAnimation.ts` stays under 200 lines.

## Verify

INDEX commands, then browser: walk in circles and into walls (feet should not run in place against a wall for long: the speed ratio comes from actual velocity, so sliding along a wall animates and a flat block does not). Ask the user to confirm the look.

## Not in this task

Sword attack animation, hit flinch (Step 6). Camera follow (next).
