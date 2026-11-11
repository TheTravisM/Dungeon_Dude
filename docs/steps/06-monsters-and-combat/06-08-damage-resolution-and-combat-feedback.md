# 06-08 Damage resolution and combat feedback

**Type:** CODE / GAMEPLAY (pure logic tested; browser check required)
**Depends on:** 06-07 approved.
**Rules:** `docs/steps/INDEX.md`. Read `docs/steps/05-hero-and-ai/STEP-5-CONTRACT.md` section 7 only.

## Goal

Fights have consequences, and they are readable. Sword hits damage monsters; monsters telegraph and strike the hero; both sides show it (flash, knockback, floating numbers, health bar, hero blink). A monster or hero at 0 health is marked dead, but removing monsters, loot, pooling and hero death handling are 06-09.

## Decisions already made (do not reopen)

- Damage is a small set of pure, tested modules. React components only read and display.
- Per-frame data stays out of React state and Zustand: health lives on ECS entities; timers are absolute milliseconds from `performance.now()`.
- Damage amount: hero hit = hero `attackPower` (10); monster strike = that monster's `attackPower` (already depth-scaled in 06-01).
- Invulnerability: monsters get a short hurt window; the hero gets 700 ms of i-frames after a hit. A monster that is in its hurt window cannot be hit again (this also stops a second sword hit from the same moment).
- Knockback applies to **monsters only**. Hero movement is Step 5 code and stays untouched; the hero gets blink + i-frames instead.
- Until 06-09, the hero cannot die: a flag keeps its health at 1 or more (`HERO_DEATH_ENABLED = false`; 06-09 flips it).
- Floating damage numbers use a fixed pool of drei `Html` elements (the project's self-hosted pixel font works there; Troika text would fetch a font from a CDN and break the tightened CSP).
- No hit-stop in this task (a Rapier time-step pause would need hero and physics changes); it can be added later.

## Inspect first

- `src/game/combat/hitEvents.ts` (`drainHits`), `src/game/hero/combat/attackState.ts`, `src/game/monsters/archetypes.ts`, `src/game/monsters/monsterRegistry.ts`.
- `src/components/monsters/MonsterActor.tsx`, `MonsterSystem.tsx`, `Monster.tsx` (`MonsterRig`), `src/components/level/LevelEntities.tsx`.
- `src/components/hero/Hero.tsx`, `useHeroRig.ts` (`rig.root`), `src/components/debug/HeroDebugReadout.tsx`.
- `src/styles/global.scss` (the self-hosted pixel font family name) and the CSP in `index.html`.
- `src/game/ecs.ts` (`heroQuery`, `monsterQuery`).

## Create: pure modules in `src/game/combat/`

1. `constants.ts`
   ```ts
   export const MONSTER_HURT_MS = 180;        // flash, stagger, and no re-hit
   export const HERO_IFRAME_MS = 700;
   export const KNOCKBACK_SPEED = 4.0;        // world units per second
   export const KNOCKBACK_MS = 150;           // about 0.6 units total
   export const STRIKE_GRACE = 0.3;           // extra reach beyond attackRange when a strike lands
   export const MONSTER_LUNGE_MS = 120;
   export const HERO_DEATH_ENABLED = false;   // flipped in 06-09
   ```
2. `damage.ts`: `applyDamage(target: Entity, amount: number, nowMs: number, hurtMs: number): { applied: boolean; dealt: number; killed: boolean }`.
   - No-op (`applied: false`) when `target.state === 'dead'`, when `nowMs < (target.hurtUntil ?? 0)`, or when `amount <= 0`.
   - Otherwise subtract from `health`, clamp at 0 (clamp at 1 for the hero while `HERO_DEATH_ENABLED` is false), set `hurtUntil = nowMs + hurtMs`, and when health reaches 0 set `state = 'dead'` and return `killed: true`.
3. `knockback.ts`: `knockbackDirection(fromX, fromZ, toX, toZ, out)` writes the unit vector from `from` to `to` (zero-length gives a fixed fallback `(0, 1)`), and `knockbackFactor(nowMs, untilMs, durationMs)` returns 1 at the start fading linearly to 0 at the end.
4. `monsterAttack.ts`: a per-monster attack state.
   ```ts
   export interface MonsterAttackState { phase: 'idle' | 'windup'; endsAtMs: number }
   export type AttackTick = 'none' | 'started' | 'cancelled' | 'strike';
   export function createMonsterAttack(): MonsterAttackState;
   export function tickMonsterAttack(s: MonsterAttackState, entity: Entity, a: MonsterArchetype, nowMs: number): AttackTick;
   ```
   - While `entity.state === 'attack'` and `s.phase === 'idle'` and `nowMs >= entity.attackReadyAt`: begin the wind-up (`phase = 'windup'`, `endsAtMs = nowMs + a.attackWindupMs`), return `'started'`.
   - While winding up: if `entity.state !== 'attack'` or the monster is dead, or `nowMs < entity.hurtUntil` (hit during wind-up interrupts), cancel (`phase = 'idle'`, `attackReadyAt = nowMs + 300`), return `'cancelled'`.
   - When `nowMs >= endsAtMs`: `phase = 'idle'`, `attackReadyAt = nowMs + a.attackCooldownMs`, return `'strike'`.
   - Anything else returns `'none'`.
5. `resolveHits.ts`: `resolveHits(findMonster: (id: string) => Entity | undefined, hero: Entity, nowMs: number, onApplied: (monster: Entity, dealt: number, killed: boolean) => void): number`. Drains `drainHits`; for each event finds the monster, calls `applyDamage(monster, hero.attackPower ?? 10, nowMs, MONSTER_HURT_MS)`; calls `onApplied` when applied; returns how many were applied. Unknown ids are ignored.
6. `damageNumbers.ts`: a fixed pool of 12 slots (`active`, `x`, `y`, `z`, `startMs`, `text`, `kind: 'dealt' | 'taken'`), `spawnDamageNumber(x, y, z, amount, kind, nowMs)` (reuses an inactive slot, else the oldest), `forEachDamageNumber(nowMs, visit)` (visits active slots with `t` from 0 to 1 over 700 ms, deactivating expired ones). No allocation after startup.
7. `deathEvents.ts`: a ring buffer of 32 `{ id: string; atMs: number }` with `pushDeath` and `drainDeaths(visit)` (the same pattern as `hitEvents`). 06-09 consumes it.

## Create: React

1. `src/components/combat/CombatSystem.tsx` (null component; under 120 lines), mounted from `LevelEntities.tsx`. One `useFrame` with `now = performance.now()`:
   - `resolveHits(...)`: `findMonster` looks up the registry (extend the registry record to hold the `entity`). On applied: set that monster's knockback in its registry record (`knockX/knockZ` from `knockbackDirection(hero -> monster)`, `knockUntil = now + KNOCKBACK_MS`), `spawnDamageNumber(..., 'dealt')`, and on `killed` call `pushDeath(id, now)`.
   - For each registered monster that is not dead: `tickMonsterAttack(record.attack, entity, archetype, now)`. On `'strike'`: if the hero exists, is alive, and the XZ distance is at most `attackRange + STRIKE_GRACE`, `applyDamage(hero, entity.attackPower, now, HERO_IFRAME_MS)`; on applied spawn a `'taken'` number at the hero. Record `record.strikeAtMs = now` for the lunge.
2. `src/components/combat/DamageNumbers.tsx` (under 90 lines): 12 fixed slots, each a `<group ref>` containing `<Html center pointerEvents="none">` with a `<div ref>` styled with the pixel font. In `useFrame`, `forEachDamageNumber`: move the group up (`y + 0.9 * t`), set the div's `textContent`, `opacity = 1 - t`, color (dealt: warm white; taken: red), and `display: none` for inactive slots. No React state.
3. `src/components/monsters/MonsterHealthBar.tsx` (under 60 lines): a drei `Billboard` with two thin planes (dark back, red fill) above the monster. The fill's `scale.x` and `position.x` follow `health / maxHealth` in `useFrame`; the bar is visible only while `health < maxHealth` and the monster is not dead.
4. `src/components/monsters/useMonsterFeedback.ts` (hook used by `MonsterActor`; under 90 lines): each frame, for the rig:
   - **Hit flash:** while `now < entity.hurtUntil`, lerp every material's emissive toward white by the remaining fraction; restore the base emissive afterwards. For this, extend `MonsterRig` in `Monster.tsx` (06-02) with `baseEmissive: Color[]` captured at creation; use one module-level scratch `Color`.
   - **Wind-up telegraph:** while the monster's attack phase is `windup`, ramp emissive toward red (`#ff2a10`) with progress `1 - (endsAtMs - now) / windupMs`, and scale the visual group up to 1.12. A telegraph must be unmistakable at this camera distance.
   - **Strike lunge:** for `MONSTER_LUNGE_MS` after `strikeAtMs`, push `rig.visual.position.z` forward (local +Z) by 0.15 and ease back.
   - Dead monsters show no flash or telegraph.
5. `src/hooks/hero/useHeroBlink.ts`: while `now < hero.hurtUntil`, toggle `rig.root.current.visible` every 80 ms; always set it `true` afterwards.

## Edits (authorized, exactly these)

- `monsterRegistry.ts`: the record also holds `entity`, `attack: MonsterAttackState`, `knockX`, `knockZ`, `knockUntil`, `strikeAtMs`.
- `MonsterSystem.tsx`: while `now < entity.hurtUntil` the monster's own desired movement is zero (stagger). Add knockback displacement `(knockX, knockZ) * KNOCKBACK_SPEED * knockbackFactor(...) * PHYSICS_TIME_STEP` to the desired translation, still through `computeColliderMovement`, so knockback cannot push a monster through a wall. Skip brain ticks and movement for `state === 'dead'`.
- `MonsterActor.tsx`: call `useMonsterFeedback(...)` and render `<MonsterHealthBar entity={entity} />`.
- `Hero.tsx`: call `useHeroBlink(rig)`.
- `LevelEntities.tsx`: mount `<CombatSystem />` and `<DamageNumbers />`.
- `HeroDebugReadout.tsx` (dev only): add `hp: <health>/<maxHealth>`.

## Tests (pure)

- `damage.test.ts`: applies damage and sets `hurtUntil`; no second hit inside the hurt window, a hit after it lands; dead targets ignored; health never below 0 (monster) or 1 (hero while `HERO_DEATH_ENABLED` is false); `killed` true exactly once; zero or negative amounts ignored.
- `monsterAttack.test.ts` (use the real archetype table): idle to `'started'` only when `state === 'attack'` and ready; `'strike'` exactly `attackWindupMs` after start; the next start is blocked until `attackCooldownMs` after the strike; leaving `'attack'` or being hit mid wind-up gives `'cancelled'`; a dead monster never strikes.
- `knockback.test.ts`: direction points away from the source; zero distance returns the fallback; factor goes 1 to 0 over the duration and is 0 afterwards.
- `resolveHits.test.ts` (uses `createMonster`, `pushHit`): one hit lowers health by the hero attack power; a kill sets `'dead'` and the caller sees `killed`; two events for one monster inside the hurt window apply once; unknown ids are ignored; the queue is empty afterwards.
- `damageNumbers.test.ts`: slots recycle (13th spawn reuses the oldest), `t` rises from 0 to 1, expired slots are skipped.
- `deathEvents.test.ts`: order, drain empties, ring overflow keeps the newest.
- Remove all test monsters with `world.remove`.

## Acceptance

- [ ] `npm test` passes the new and existing tests.
- [ ] Browser, manual (hold Space beside a slime): each hit shows a floating `10`, a white flash, a small knockback, and the health bar shrinks; a slime dies on the 3rd hit, a skeleton on the 2nd, a bat on the 1st. A dead monster stops moving and attacking and stays where it fell (removal is 06-09).
- [ ] A chasing monster visibly winds up (red glow and swell) before it strikes, then lunges; if the hero steps out of range during the wind-up, the strike misses and no damage is taken.
- [ ] When a strike lands, the hero loses health (debug readout `hp`), shows a red floating number, and blinks; further strikes inside 700 ms do nothing; the hero never drops below 1 hp yet.
- [ ] Knockback never pushes a monster through a wall or into the floor; monsters keep their feet on the floor.
- [ ] In auto mode the hero fights, kills nearby monsters, and resumes exploring on its own.
- [ ] No per-frame React state or Zustand writes; no console output; no new dependencies; no `any`; every file under 200 lines; steady frame rate with five monsters fighting.

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Give the user the browser steps above and wait for confirmation.

## Not in this task

Removing dead monsters, death animation, loot or gold, `monstersSlain`, pooling, hero death or game over, the HUD, audio, key, stairs, hit-stop. Do not tick the checklist, update the handoff, or commit until the user approves.