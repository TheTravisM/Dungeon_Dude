# 06-07 Sword hit detection with a Rapier sensor

**Type:** CODE / PHYSICS (pure logic tested; browser check required)
**Depends on:** 06-06 approved.
**Rules:** `docs/steps/INDEX.md`. Read `docs/steps/05-hero-and-ai/STEP-5-CONTRACT.md` sections 6.1 and 7 only.

## Goal

Know which monsters each sword swing hits, using a Rapier **sensor collider** on the hero and its intersection events. Each swing registers at most one hit per monster. The result is a queue of hit events that 06-08 will turn into damage. **No damage, health change, knockback, or flash happens in this task.**

## Decisions already made (do not reopen)

- A sensor collider plus intersection events, as approved in `AI_HANDOFF.md`. No hand-rolled raycasts, no geometry code, no scan over every monster.
- The hit window is the `active` phase of the hero attack state (06-06). Events only maintain "who is inside the sensor right now"; hits are collected during the active window, so a monster already inside when the window opens is hit, and one that leaves before it opens is not.
- One hit per monster per swing, keyed by `swingId`.
- The sensor is a **ball** in front of the hero, not a rotated box: the hero's `RigidBody` is never rotated (only the visual is), and a ball needs only a translation update each frame, not a rotation.
- Monsters are identified by **collider handle**, through the monster registry from 06-05, not by `userData` or Three objects.

## Inspect first

- Installed typings for `@react-three/rapier` 2.2.0: `BallCollider` props (`sensor`, `onIntersectionEnter`, `onIntersectionExit`, `activeCollisionTypes`), the event payload shape (`other.collider`), and Rapier 0.19's `ActiveCollisionTypes` and `QueryFilterFlags.EXCLUDE_SENSORS`. If any name is missing, stop and report the exact typing found.
- `src/components/hero/Hero.tsx`, `src/hooks/hero/useHeroRig.ts` (the rig root whose `rotation.y` is the visible heading), `src/hooks/hero/useHeroMovement.ts`, `src/hooks/hero/useHeroAttack.ts` and `src/game/hero/combat/attackState.ts` (from 06-06), `src/game/hero/constants.ts` (`HERO_CAPSULE_CENTER_Y`).
- `src/game/monsters/monsterRegistry.ts`, `src/components/monsters/MonsterActor.tsx`, `src/components/monsters/MonsterSystem.tsx` (from 06-05).
- `src/components/debug/HeroDebugReadout.tsx` (dev-only readout from 05-04).

## Constants (append to `src/game/hero/constants.ts`)

```ts
export const HERO_SWORD_OFFSET = 0.5;  // sensor center in front of the hero, world units
export const HERO_SWORD_RADIUS = 0.6;  // sensor radius; far edge reaches about 1.1 in front
```

## Create

### 1. `src/game/hero/combat/swordHits.ts` (pure; under 90 lines)

```ts
export interface HitTracker {
  enter(id: string): void;   // a monster entered the sensor
  exit(id: string): void;    // a monster left it (or was removed)
  /** During the 'active' phase, appends each monster inside and not yet hit by this swing to `out`. Other phases append nothing. */
  collect(swingId: number, phase: AttackPhase, out: string[]): string[];
  clear(): void;
}
export function createHitTracker(): HitTracker;
export const swordTracker: HitTracker; // module singleton
```

- Keeps `inside: Set<string>`, `hitThisSwing: Set<string>`, and `lastSwingId`. When `collect` sees a new `swingId`, it clears `hitThisSwing` first.
- `collect` sets `out.length = 0` then fills it, in the order monsters entered. Allocation-free in steady state.

### 2. `src/game/combat/hitEvents.ts` (pure; under 70 lines)

```ts
export interface HitEvent { targetId: string; swingId: number; atMs: number }
export function pushHit(targetId: string, swingId: number, atMs: number): void;
export function drainHits(visit: (e: HitEvent) => void): void;   // visits in order, then empties the queue
export const hitStats: { total: number; lastTargetId: string };  // dev readout only
```

- A fixed ring buffer of 64 preallocated event objects; when full, the oldest is overwritten. No allocation on push or drain. `pushHit` also updates `hitStats`.

### 3. `src/components/hero/SwordSensor.tsx` (under 80 lines)

Props: `{ rig: HeroRig }`. Rendered **inside** the hero's `<RigidBody>`:

```tsx
<BallCollider
  ref={sensorRef}
  args={[HERO_SWORD_RADIUS]}
  sensor
  activeCollisionTypes={ActiveCollisionTypes.ALL}
  position={[0, HERO_CAPSULE_CENTER_Y, HERO_SWORD_OFFSET]}
  onIntersectionEnter={({ other }) => { const id = entityIdForCollider(other.collider.handle); if (id) swordTracker.enter(id); }}
  onIntersectionExit={({ other }) => { const id = entityIdForCollider(other.collider.handle); if (id) swordTracker.exit(id); }}
/>
```

- Why `ActiveCollisionTypes.ALL`: Rapier's default skips kinematic-versus-kinematic pairs, and both the hero and the monsters are kinematic, so without this no events fire. If events still do not fire, also set it on the monster capsule collider in `MonsterActor`.
- Each frame (`useFrame`, one per component): read the visible heading `h = rig.root.current.rotation.y` and call `sensor.setTranslationWrtParent({ x: Math.sin(h) * HERO_SWORD_OFFSET, y: HERO_CAPSULE_CENTER_Y, z: Math.cos(h) * HERO_SWORD_OFFSET })` using one module-level scratch object. The sensor then follows the way the hero faces.
- In the same `useFrame`, after `updateAttack` has run for the frame (call order: `useHeroAttack` first, then this): `swordTracker.collect(heroAttack.swingId, heroAttack.phase, scratchIds)` and for each id `pushHit(id, heroAttack.swingId, performance.now())`. Put this in a small `useSwordHits()` hook in the same file or `src/hooks/hero/useSwordHits.ts` if the component would pass 80 lines.
- Verify the order of hooks in `Hero.tsx` so `useHeroAttack` runs before the sensor frame callback.

### 4. Edits (authorized, exactly these)

- `src/components/hero/Hero.tsx`: mount `<SwordSensor rig={rig} />` inside the hero `RigidBody`. Nothing else.
- `src/hooks/hero/useHeroMovement.ts`: pass `QueryFilterFlags.EXCLUDE_SENSORS` as the filter flags argument of `computeColliderMovement`, so the hero's own sword sensor can never block or snag the controller.
- `src/components/monsters/MonsterSystem.tsx`: the filter flags become `QueryFilterFlags.EXCLUDE_KINEMATIC | QueryFilterFlags.EXCLUDE_SENSORS`.
- `src/game/monsters/monsterRegistry.ts`: keep a second map from collider handle to entity id, filled in `register` and removed in `unregister`; export `entityIdForCollider(handle: number): string | undefined`.
- `src/components/monsters/MonsterActor.tsx`: in its cleanup (where it unregisters) also call `swordTracker.exit(entity.id)` so a removed monster never stays "inside".
- `src/components/debug/HeroDebugReadout.tsx` (dev only): add a line `hits: <hitStats.total>  last: <hitStats.lastTargetId>` using the existing ref/`textContent` update, no React state.

## Plan B (use only if intersection events cannot be made to fire)

Keep the same sensor and `HitTracker`, but replace the events with a poll: during the `active` phase only, call `world.intersectionPairsWith(sensorCollider.collider, visit)` once per frame and feed ids to `swordTracker.enter`. If that also fails, use `world.intersectionsWithShape` with a `rapier.Ball` at the sensor's world position (scene queries ignore the active collision types). Report which route was used. Never write custom collision math.

## Tests (pure)

`src/game/hero/combat/swordHits.test.ts`:
- A monster that enters before the swing and stays inside is collected once at the start of the active phase, and not again on later active frames of the same swing.
- A monster that enters during `active` is collected on the next call, once.
- A monster that leaves before `active` begins is not collected.
- No ids are collected during `windup`, `recovery`, or `ready`.
- A new `swingId` allows the same monster to be hit again.
- Several monsters are each collected once per swing, in entry order.
- `exit` of an unknown id is harmless; `clear` empties everything.
- `collect` reuses the `out` array and clears stale contents.

`src/game/combat/hitEvents.test.ts`:
- Events drain in insertion order and the queue empties afterwards.
- Pushing more than 64 events keeps the newest 64 and never throws.
- `hitStats.total` counts every push, including overwritten ones.

## Acceptance

- [ ] `npm test` passes the new and existing tests.
- [ ] Browser (dev, physics debug on): a ball sensor outline sits in front of the hero and turns with its facing, including while the hero walks and when it attacks automatically.
- [ ] Standing beside a monster and swinging (Space): the debug readout's `hits` goes up by exactly **one per swing per monster**, never several per swing; a monster behind the hero is not hit; a monster outside the sensor is not hit.
- [ ] A monster that walks into the sensor during the active window is hit once; one that is inside when the swing starts is hit at the active window.
- [ ] The sensor never blocks or snags hero movement; walking through doorways and one-tile corridors is unchanged.
- [ ] Removing monsters mid-test (reload at another depth) leaves no stale "inside" ids and no console errors.
- [ ] No damage, health, knockback, flash, or HUD change; no new dependencies; no `any`; every file under 200 lines; no console output.

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Give the user the browser steps above, report whether events or Plan B were used, and wait for confirmation.

## Not in this task

Applying damage, health, knockback, invulnerability, hit flash, damage numbers, monster attacks, death, loot. Do not tick the checklist, update the handoff, or commit until the user approves.