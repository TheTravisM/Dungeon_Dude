# 06-05 Monster aggro and movement behavior

**Type:** CODE / AI + PHYSICS (browser check required)
**Depends on:** 06-04 approved.
**Rules:** `docs/steps/INDEX.md`. Read `docs/steps/05-hero-and-ai/STEP-5-CONTRACT.md` sections 3 (constants), 6.1 (Rapier controller), and 7 (risks) only.

## Goal

Monsters come alive. They stand at home until the hero gets close, chase along real routes, stop at attack range facing the hero, give up if the hero gets away, and walk back home. They move with the same Rapier kinematic character controller as the hero, so they slide along walls and never clip. **They do not attack or deal damage yet** (06-07 adds swings and damage).

## Decisions already made (do not reopen)

- Brain: one small `mistreevous` tree per monster, stepped at about 5 Hz (staggered per monster). Movement is a per-physics-step system outside the tree.
- Every tree action is **instant** (returns `State.SUCCEEDED` at once and only records an intent). This is required: `mistreevous` does not re-evaluate earlier conditions while a leaf is `RUNNING`, so a long-running action would never notice that the hero came into range. The tree is a priority-ordered decision function, re-run from the root each tick.
- Reuse the Step 5 navigation code (`createWalkGrid`, `planWorldPath`, `smoothPath`, `directionToWaypoint`, `createStuckDetector`). Do not add a second pathfinder.
- Monsters collide with static walls but **pass through other kinematic bodies** (the hero and each other) using the controller's `QueryFilterFlags.EXCLUDE_KINEMATIC`; separation steering keeps them from stacking. The hero's own controller still treats monsters as obstacles (known interim limitation, see below).
- Entity `state` is the coarse state: `'idle'` (at home, still), `'chase'`, `'attack'` (in range, holding and facing the hero), `'patrol'` (walking back home). `'dead'` is 06-09.
- No line-of-sight raycasts. Aggro requires a real walkable route that is not much longer than the straight distance, which handles walls without hand-rolled geometry.

## Inspect first

- `src/game/hero/navigation/*` (`createWalkGrid`, `worldToGrid`, `planWorldPath`, `smoothPath`, `route.ts` `directionToWaypoint`, `WorldPoint`), `src/game/hero/ai/stuckDetector.ts`, `src/game/hero/constants.ts` (`HERO_GROUND_CLEARANCE`, `HERO_PATH_CLEARANCE`, `HERO_WAYPOINT_REACH`, `HERO_CONTROLLER_OFFSET`).
- `src/hooks/hero/useHeroMovement.ts` and `src/components/hero/Hero.tsx`: the exact controller setup, `useBeforePhysicsStep` pattern, scratch objects, and ECS write-back to mirror. The body origin is at the **feet** and the collider is a child offset upward.
- `src/components/level/LevelEntities.tsx`, `src/components/monsters/Monster.tsx` (`MonsterRig`), `src/game/monsters/archetypes.ts`, `monsterIndex.ts`, `spatialHash.ts`.
- Installed typings for `@react-three/rapier` 2.2.0 / Rapier 0.19: confirm `computeColliderMovement(collider, desired, filterFlags?)` and `QueryFilterFlags.EXCLUDE_KINEMATIC`. If either is missing, stop and report the exact typing found.
- `src/game/dungeon/random.ts` (`createRandom`) for the seeded jitter.

## Create

### 1. `src/game/monsters/ai/steering.ts` (pure; under 60 lines)

```ts
export const SEPARATION_RADIUS = 0.7;
export function aggroAllowed(straightDist: number, routeLength: number, aggroRange: number): boolean;
export function separationVector(
  x: number, z: number, self: unknown,
  neighbors: readonly { position?: { x: number; z: number } }[],
  out: { x: number; z: number }
): { x: number; z: number };
```

- `aggroAllowed`: true when `straightDist <= aggroRange` **and** `routeLength <= aggroRange * 1.6 + 1`. A hero in the next room behind one wall is "close" in a straight line but far by route, so no aggro.
- `separationVector`: sums `(self - other) / max(d^2, 0.01)` for neighbors within `SEPARATION_RADIUS` (skip `self` by identity), then scales to at most length 1; writes into and returns `out`, zero when there are no neighbors. No allocation.

### 2. `src/game/monsters/ai/monsterBrain.ts` (under 200 lines; no React, no Rapier)

```ts
export const MONSTER_TREE = `root {
  selector {
    sequence { condition [HeroInAttackRange] action [HoldAndFace] }
    sequence { condition [ShouldChase]       action [Chase] }
    sequence { condition [AwayFromHome]      action [ReturnHome] }
    action [Idle]
  }
}`;   // keep as a named const so later steps can extend it

export interface MonsterBrain {
  tick(nowMs: number): void;                                   // ~5 Hz: decide
  desiredDirection(nowMs: number, out: { x: number; z: number }): void; // every physics step: unit vector or zero
}
export function createMonsterBrain(
  entity: Entity, layout: DungeonLayout, grid: WalkGrid,
  getHeroPoint: () => WorldPoint | null,                      // null when the hero is missing or dead
  rngSeed: number
): MonsterBrain
```

- Stats come from `MONSTER_ARCHETYPES[entity.archetype]`. Home is the entity's initial `x, z`.
- **Aggro with hysteresis.** Not aggroed: each tick, if the hero is within `aggroRange` (straight line), plan a route (`planWorldPath`); if `aggroAllowed(...)` becomes aggro. Aggroed: stay aggroed until the hero is farther than `aggroRange * 1.6` straight-line, or two consecutive plans fail, or the stuck detector reaches level 2 (then also ignore the hero for 3 s before aggro may start again).
- **Conditions and actions (all instant).**
  - `HeroInAttackRange`: hero within `attackRange` (XZ distance).
  - `HoldAndFace`: `state = 'attack'`, intent direction zero, `heading` toward the hero.
  - `ShouldChase`: aggroed (after the update above).
  - `Chase`: `state = 'chase'`; repath at most every 400 ms (stagger the first repath per monster with the seeded RNG so 15 monsters do not plan on the same frame) with `planWorldPath` then `smoothPath(grid, start, points)`; store the points. When the hero is within 1.5 tiles and `hasClearLine(grid, monster, hero, HERO_PATH_CLEARANCE)`, aim straight at the hero instead.
  - `AwayFromHome`: XZ distance to home above 0.25.
  - `ReturnHome`: `state = 'patrol'`; plan and smooth a route to home like `Chase`.
  - `Idle`: `state = 'idle'`, zero direction.
- **`desiredDirection`**: follow the stored route with `directionToWaypoint(pos, route, HERO_WAYPOINT_REACH)`; drop consumed waypoints; then, only while `state` is `'chase'` or `'patrol'`, add `separationVector` from `monsterIndex.queryRadius` (module-level scratch array) at weight 0.6 and renormalize. Writes zero for `'idle'` and `'attack'`. Updates `entity.heading = Math.atan2(dir.x, dir.z)` only when the direction is nonzero (and in `HoldAndFace`, toward the hero).
- **Stuck handling.** One `createStuckDetector()` per brain; sample from `desiredDirection`'s caller via `tick` with `wantsToMove = state is chase or patrol`. Level 1: force a repath. Level 2 or higher: drop aggro for 3 s and head home. (Never snap monsters.)
- Build the tree once with `new BehaviourTree(MONSTER_TREE, agent, { random: () => rng.next() })`; `tick` calls `tree.step()`. No `console` output.
- Mutate the entity only through its own fields (`state`, `heading`); never replace `position`.

### 3. `src/game/monsters/monsterRegistry.ts` (under 40 lines)

A module-level `Map<string, { body: RapierRigidBody; collider: RapierCollider; brain: MonsterBrain; rig: MonsterRig | null }>` with `register`, `unregister`, and `forEach` helpers. Plain functions, no React.

### 4. `src/components/monsters/MonsterActor.tsx` (under 120 lines)

Props: `{ entity: Entity }`. Renders:

```tsx
<RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} canSleep={false} lockRotations position={feetPosition}>
  <CapsuleCollider ref={colliderRef} args={[halfHeight, radius]} position={[0, centerY, 0]} />
  <Monster archetype={entity.archetype!} rigRef={rigRef} />
</RigidBody>
```

- `halfHeight = Math.max(0.01, (height - 2 * radius) / 2)`, `centerY = HERO_GROUND_CLEARANCE + halfHeight + radius`, from the archetype. The body origin is at the feet, exactly like the hero.
- After mount, build the brain (`createMonsterBrain`, `useMemo` keyed on the entity, seeded from `layout.seed ^ hash(entity.id)`) and `register` everything; `unregister` in cleanup (StrictMode safe).
- Each `useFrame`: damp the visual heading (`easing.dampAngle(rig.visual.rotation, 'y', entity.heading ?? 0, 0.12, delta)`) and apply a tiny walk motion while `state` is `'chase'` or `'patrol'`: `rig.visual.position.y = Math.sin(t * 9) * 0.03` (bat `0.05` at frequency 14), and squash the slime on the same phase (scale y `1 + 0.06 * sin`). Reset smoothly to rest when not moving. No allocations, no React state.

### 5. `src/components/monsters/MonsterSystem.tsx` (null component; under 120 lines)

- Props: `{ layout: DungeonLayout }`. `grid = useMemo(() => createWalkGrid(layout), [layout])`.
- Create **one** controller `world.createCharacterController(HERO_CONTROLLER_OFFSET)` shared by all monsters (settings identical to the hero; remove it in cleanup). The controller is only a settings holder; calls are sequential inside one step.
- `useFrame`: brain tick scheduler. Each registered monster has `nextTickAt`; when `performance.now() >= nextTickAt`, run `brain.tick(now)` and set `nextTickAt = now + 200 + jitter(0 to 40 ms)`. At most 4 ticks per frame so a first-frame burst cannot spike.
- `useBeforePhysicsStep`: for each registered monster call `brain.desiredDirection(now, scratch)`, compute `delta = dir * moveSpeed * PHYSICS_TIME_STEP`, `controller.computeColliderMovement(collider, { x: delta.x, y: 0, z: delta.z }, QueryFilterFlags.EXCLUDE_KINEMATIC)`, then `body.setNextKinematicTranslation` with the current translation plus `computedMovement()` (y unchanged), exactly as `useHeroMovement` does. Write back to the entity: `position.set(x, FLOOR_TOP, z)` (mutate), `velocity`, no new objects.
- A monster with `state === 'dead'` is skipped.

### 6. Edits

- `LevelEntities.tsx`: replace the static monster `<group><Monster/></group>` with `<MonsterActor entity={e} />`, mount `<MonsterSystem layout={layout} />`, and move the whole `LevelEntities` mount in `App.tsx` **inside** `<GamePhysics>` (monsters need the physics world). Markers stay static.
- Dev-only label (reuse the existing `pathDebug` store flag from Step 5): when it is on, show each monster's `state` with a small drei `Html` above it, gated by `import.meta.env.DEV`. Keep it under 20 lines inside `MonsterActor`.

## Tests (pure, `src/game/monsters/ai/`)

`steering.test.ts`:
- `aggroAllowed`: false beyond range; false when the route is much longer than the straight line; true at equal distances; boundary at exactly `aggroRange`.
- `separationVector`: zero with no neighbors; points away from a single neighbor; capped at length 1; ignores `self`; ignores neighbors beyond the radius; reuses `out`.

`monsterBrain.test.ts` (headless; build `generateDungeon(seed)` and `createWalkGrid`, a `createMonster` entity, and a fake hero; simulate a point mass at the archetype speed on 60 Hz steps, calling `tick` every 200 ms):
- For seeds 1 to 30 and all three archetypes: hero placed in the same room at 3 tiles from the monster (inside aggro for all archetypes): the monster reaches `state === 'attack'` within 10 simulated seconds, and at every step stands on a walkable cell (`worldToGrid` then `isWalkable`).
- Hero outside `aggroRange` at start: the monster stays `'idle'` and does not move for 10 seconds.
- Chase then escape: after reaching `'attack'`, move the hero to a far room; within 15 simulated seconds the monster is `'idle'` again within 0.3 of home.
- Hero `null` (missing): monster is idle and stable.
- Determinism: two runs with the same seed give identical final positions.
- Remove all entities with `world.remove` after each test.

## Acceptance

- [ ] `npm test` passes the new tests.
- [ ] Browser (dev, `pathDebug` on): idle monsters stand still at home; walking the hero within a monster's aggro range makes it chase around corners and through doorways without touching walls; it stops at a short distance, faces the hero, and shows `attack`.
- [ ] Leave the room: the monster loses interest after the hero is well away and walks home, then shows `idle`.
- [ ] Several monsters chasing at once spread out instead of stacking; none snag in one-tile corridors; none float, sink, or drift vertically.
- [ ] Bats are fastest and slimes slowest, all visibly slower than or close to the hero (3.0).
- [ ] No console errors or warnings (dev and `npm run build` then `npm run preview`). Frame rate does not drop with all monsters active.
- [ ] Per-frame data lives only in ECS entities and module objects; no Zustand writes; no new dependencies; no `any`; every file under 200 lines.

## Known interim limitation

The hero cannot yet attack, and monsters are solid to the hero's own controller, so a monster can block the hero in a corridor until 06-06 makes the hero stop and fight. If this blocks the browser check, say so in the report; do not change hero code in this task.

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Give the user the browser steps above and wait for confirmation.

## Not in this task

Monster attacks, wind-up, damage, hero attacks, hit detection, health display, death, loot, pooling. Do not tick the checklist, update the handoff, or commit until the user approves.