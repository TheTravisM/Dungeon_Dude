# 06-06 Hero attack state, Space input, and fight behavior

**Type:** CODE / AI (pure logic tested, plus wiring; browser check required)
**Depends on:** 06-05 approved.
**Rules:** `docs/steps/INDEX.md`. Read `docs/steps/05-hero-and-ai/STEP-5-CONTRACT.md` sections 3 and 6.5 only.

## Goal

The hero can swing its sword: a timed attack (wind-up, active, recovery) triggered by Space or gamepad in manual mode, and automatically by the behavior tree when a monster is near. The swing animates. **It does not damage anything yet**: the hit window exists as a state (`active`) that 06-07 turns into real Rapier sensor hits.

## Decisions already made (do not reopen)

- Attack is a small pure state machine, kept in a module-level singleton (like `inputState`). No Zustand, no React state, no per-frame allocation.
- Auto mode fights through the existing `mistreevous` tree (new top-priority branch). Manual mode attacks only when Space (or gamepad attack) is held; manual always wins over auto, as in Step 5.
- Every time value is in milliseconds from `performance.now()`, passed in as `nowMs`, so 06-08 can add hit-stop by shifting time without touching the state machine.
- Auto fighting is committed: the hero holds still and faces the target through wind-up, active, and recovery. Manual attacking may move freely.

## Inspect first

- `src/game/hero/ai/heroBrain.ts` (the `HERO_TREE` MDSL const, `TrackRoute`, `PlanNext`, `onManualTakeover`), `src/hooks/hero/useHeroBrain.ts`.
- `src/game/hero/intent.ts` (`resolveHeroDirection`), `src/game/hero/input/inputState.ts` (`attack`, `isManualNow`), `src/hooks/hero/useHeroMovement.ts` (it writes `heading` only when the direction is nonzero).
- `src/hooks/hero/useHeroAnimation.ts` and `useHeroRig.ts` (`armSword`; 05-06 said a later step overrides its rotation for attacks, which is this task).
- `src/game/hero/navigation/route.ts` (`clearRoute`), `src/game/hero/navigation/pathSmoothing` (`hasClearLine`), `src/game/hero/constants.ts`.
- `src/game/monsters/monsterIndex.ts` (`monsterIndex.nearest`).

## Edits to `src/game/hero/constants.ts` (append only)

```ts
export const HERO_ATTACK_WINDUP_MS = 120;
export const HERO_ATTACK_ACTIVE_MS = 140;
export const HERO_ATTACK_RECOVERY_MS = 260;
export const HERO_ATTACK_REACH = 1.15;   // tiles, center to center; the sword sensor in 06-07 uses this
export const HERO_ENGAGE_RANGE = 2.6;    // tiles; auto mode starts fighting inside this
export const HERO_COMBAT_HOLD_MS = 300;  // how long a combat intent stays valid without a refresh
```

## Create

### 1. `src/game/hero/combat/attackState.ts` (pure; under 90 lines)

```ts
export type AttackPhase = 'ready' | 'windup' | 'active' | 'recovery';
export interface AttackState { phase: AttackPhase; phaseStartMs: number; swingId: number }
export function createAttackState(): AttackState;
export function requestAttack(s: AttackState, nowMs: number): boolean;   // only from 'ready'; increments swingId
export function updateAttack(s: AttackState, nowMs: number): AttackPhase; // advances phases; a big time jump may pass several phases
export function attackProgress(s: AttackState, nowMs: number): number;   // 0..1 within the current phase, 0 when ready
export const heroAttack: AttackState; // module singleton
```

- `requestAttack` returns false (and changes nothing) unless the phase is `ready`. On success: `phase = 'windup'`, `phaseStartMs = nowMs`, `swingId += 1`.
- `updateAttack` moves `windup -> active -> recovery -> ready` using the three durations, carrying leftover time so a late frame does not stretch a swing. After recovery it returns `ready`.
- `swingId` identifies one swing for the whole swing; 06-07 uses it to prevent double hits.

### 2. `src/game/hero/combat/combatIntent.ts` (pure; under 50 lines)

```ts
export interface CombatIntent { dirX: number; dirZ: number; moveUntil: number; attackUntil: number; engaged: boolean }
export const heroCombat: CombatIntent;
export function setCombatMove(dirX: number, dirZ: number, nowMs: number): void; // moveUntil = now + HERO_COMBAT_HOLD_MS
export function setCombatAttack(nowMs: number): void;                           // attackUntil = now + HERO_COMBAT_HOLD_MS
export function combatDirection(nowMs: number, out: { x: number; z: number }): boolean; // true while a move intent is live
export function wantsAttack(nowMs: number): boolean;
export function resetCombat(): void;
```

Intents expire by themselves, so if the brain stops (manual takeover, no target) nothing needs cleaning up.

### 3. `src/hooks/hero/useHeroAttack.ts`

```ts
export function useHeroAttack(): void
```

One `useFrame`: `now = performance.now()`; `updateAttack(heroAttack, now)`; then `if ((isManualNow(now) && inputState.attack) || (!isManualNow(now) && wantsAttack(now))) requestAttack(heroAttack, now)`. Holding Space repeats swings at the natural cycle (windup + active + recovery = 520 ms). Nothing else.

### 4. Edits to existing Step 5 files (authorized, exactly these)

- `src/components/hero/Hero.tsx`: call `useHeroAttack()` next to the other hero hooks. Nothing else.
- `src/game/hero/intent.ts` (`resolveHeroDirection`): after the manual branch and before the route branch add: if `!isManualNow(now)` and `combatDirection(now, scratch)` is true, return that direction (zero while holding to swing). Keep the manual-wins rule and the existing tests green.
- `src/hooks/hero/useHeroAnimation.ts`: while `heroAttack.phase !== 'ready'`, override `armSword.rotation.x` by phase and `attackProgress` (damp with `easing.damp`, or set directly for the sharp active phase): windup raises the sword back (about 1.0 rad), active sweeps forward and down (about 1.2 rad past neutral, fast), recovery eases back to the walk-cycle value. The sign depends on how the rig was built; fix the sign here, not in the model. Also tilt the hips forward slightly (about 0.1 rad) during active. No allocations.
- `src/game/hero/ai/heroBrain.ts`:
  1. Replace the tree with:
     ```
     root {
       selector {
         sequence { condition [EnemyInReach] action [Fight] }
         sequence { condition [HasRoute]     action [TrackRoute] }
         action [PlanNext]
       }
     }
     ```
  2. **Required change:** `TrackRoute` currently returns `State.RUNNING` while following a route. `mistreevous` does not re-evaluate earlier conditions while a leaf is `RUNNING`, so combat would never interrupt it. Make `TrackRoute` return `State.SUCCEEDED` in the normal case (the tree restarts from the root every tick); keep `FAILED` for the stuck recoveries as they are. `PlanNext` still runs only when there is no route.
  3. `EnemyInReach()`: `target = monsterIndex.nearest(hero.x, hero.z, HERO_ENGAGE_RANGE)`; true only if `target` exists **and** `hasClearLine(grid, hero, target, HERO_PATH_CLEARANCE)`. Store it in a field the action reads.
  4. `Fight()` (always `State.SUCCEEDED`): on the first tick of a fight (`heroCombat.engaged` false) call `clearRoute()`, `stuck.reset`, and set `engaged = true`. Compute the distance to the target. If it is greater than `HERO_ATTACK_REACH * 0.9`, `setCombatMove(dirToTarget)`. Otherwise `setCombatMove(0, 0)`, write `entity.heading = Math.atan2(dx, dz)` on the hero entity (the movement hook does not overwrite heading when the direction is zero), and `setCombatAttack(now)`.
  5. When no enemy is in reach, set `heroCombat.engaged = false` (done in `TrackRoute` and `PlanNext`, or at the top of `tick`). The route is already cleared, so `PlanNext` plans the next room and exploration resumes.
  6. `onManualTakeover` also calls `resetCombat()`.
  7. If `heroBrain.ts` would exceed 200 lines, move `EnemyInReach` and `Fight` into `src/game/hero/ai/heroCombatActions.ts` and import them.

## Tests (pure; `src/game/hero/combat/` and `src/game/hero/ai/`)

`attackState.test.ts` (fake clock):
- `ready` at start; `requestAttack` returns true once, then false until the swing finishes.
- Phase boundaries at exactly the three durations: `windup`, `active`, `recovery`, back to `ready` at 520 ms.
- A single large time jump (for example +1000 ms) lands on `ready` with `swingId` unchanged.
- `swingId` increments only on accepted requests.
- `attackProgress` is 0 to 1 within each phase and 0 when ready.

`combatIntent.test.ts`: intents expire after `HERO_COMBAT_HOLD_MS`; `combatDirection` returns false when expired; `resetCombat` clears everything.

`heroBrain.combat.test.ts` (headless; `generateDungeon(seed)`, `createHeroBrain`, `createMonster`, `rebuildMonsterIndex`; seeds 1 to 20):
- Monster 2 tiles from the hero in the same room with a clear line: after `tick`, `combatDirection` is live and points toward the monster; once the hero point mass has moved within `HERO_ATTACK_REACH * 0.9`, `wantsAttack` becomes true and the movement direction is zero.
- Monster beyond `HERO_ENGAGE_RANGE`: no combat intent; exploration continues.
- Monster on the other side of a wall within range (no clear line): no combat intent.
- After the monster is removed from the world and the index rebuilt, `engaged` becomes false and the brain plans a route again.
- `onManualTakeover` resets combat.
- The existing 05-13 exploration tests still pass with the new tree.
- Remove all test entities with `world.remove`.

## Acceptance

- [ ] `npm test` passes the new and the existing tests.
- [ ] Browser, manual: hold Space and the hero swings repeatedly (about two swings per second), the sword visibly winds up, sweeps, and recovers; you can walk while swinging; manual input still wins and auto resumes 4 s after release.
- [ ] Browser, auto: when the hero walks near a monster it stops, turns toward it, and swings at it on its own, then continues exploring once the monster is gone from reach (monsters are not killable yet, so test by walking away or from a monster that cannot reach).
- [ ] No console output; frame rate unchanged; no `any`; no new dependencies; every file under 200 lines.
- [ ] The hero never attacks through a wall; it never swings while no monster is near in auto mode.

## Known limitation

Swings do no damage yet and monsters cannot be killed, so an auto fight lasts until the hero or monster moves away. That is expected until 06-07 and 06-08.

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Give the user the browser steps above and wait for confirmation.

## Not in this task

Hit detection (Rapier sensor), damage, knockback, hit flash, health, death, hero taking damage, loot, key, stairs. Do not tick the checklist, update the handoff, or commit until the user approves.
