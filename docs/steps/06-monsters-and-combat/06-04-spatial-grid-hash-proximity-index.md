# 06-04 Spatial grid hash proximity index

**Type:** CODE / LOGIC (pure, tested) + small wiring
**Depends on:** 06-03 approved.
**Rules:** `docs/steps/INDEX.md`. Inspect only the files listed below.

## Goal

A tiny, allocation-free spatial hash over living monsters, rebuilt at a fixed rate, so "which monsters are near this point" never needs a scan of every monster inside a per-frame loop. Nothing uses it yet; 06-05 (monster separation) and 06-06 (the hero picking its nearest target) will.

## Decisions already made (do not reopen)

- Keep the hash even though a level has only about 6 to 20 monsters: it is approved in `AI_HANDOFF.md`, it is about 70 lines, and the hero and every monster will query it several times per second.
- No dependency. A hand-written uniform grid is the right tool at this size.
- Rebuilt at `MONSTER_INDEX_HZ = 20` (0.05 s). At the fastest monster speed (2.6) that is at most 0.13 world units of staleness. It is a proximity index, not a collision system; Rapier owns collision.
- The index stores entity references and a copy of x and z. It never mutates entities.

## Inspect first

- `src/game/ecs.ts` (`monsterQuery`), `src/types/index.ts` (`Entity`).
- `src/components/level/LevelEntities.tsx` (from 06-03).
- `src/game/dungeon/random.ts` (`createRandom`, for the test).

## Create

### 1. `src/game/monsters/spatialHash.ts` (pure; no React, no three, no ECS; under 90 lines)

```ts
export interface SpatialHash<T> {
  clear(): void;
  insert(item: T, x: number, z: number): void;
  /** Items within `radius` of (x, z), Euclidean, boundary inclusive. Fills and returns `out`. */
  queryRadius(x: number, z: number, radius: number, out: T[]): T[];
  /** Closest item within `radius`, ties to the earliest inserted, or null. */
  nearest(x: number, z: number, radius: number): T | null;
  readonly size: number;
}
export function createSpatialHash<T>(cellSize?: number): SpatialHash<T>; // default 2
```

Requirements:

- Buckets live in a `Map<number, number[]>` of item indices. Item data lives in parallel arrays `items`, `xs`, `zs`. Cell key: `(cx + 512) * 1024 + (cz + 512)` with `cx = Math.floor(x / cellSize)`.
- `clear()` empties every bucket array in place (`length = 0`) and keeps the map and arrays, so a steady-state rebuild allocates nothing. Do not delete map entries each rebuild.
- `queryRadius` sets `out.length = 0`, visits only the cells overlapping the query square, then keeps items whose squared distance is at most `radius * radius`. Items come out in insertion order within the result (sort by insertion index so results are stable). A negative or NaN radius returns `out` empty.
- `nearest` uses the same visit but tracks the best squared distance and returns the earliest-inserted item on ties. It allocates nothing.
- `size` is the number of inserted items since the last `clear`.

### 2. `src/game/monsters/monsterIndex.ts` (under 50 lines)

```ts
export const MONSTER_INDEX_HZ = 20;
export const monsterIndex: SpatialHash<Entity>; // createSpatialHash<Entity>(2)
export function rebuildMonsterIndex(): void;
```

`rebuildMonsterIndex` clears the hash, then for each entity in `monsterQuery` whose `state !== 'dead'` inserts it at `position.x`, `position.z`. Use a plain `for` loop over `monsterQuery.entities`, no `.filter`, no spread, no new arrays.

### 3. `src/components/level/MonsterIndexSystem.tsx` (null component; under 40 lines)

- Calls `rebuildMonsterIndex()` once on mount (so the index is valid on the first frame) and then from `useFrame` using an accumulator: add `delta`, and while it is at least `1 / MONSTER_INDEX_HZ`, subtract and rebuild once (never more than once per frame). No state, no refs besides the accumulator.
- Mount it from `LevelEntities.tsx` (one added line). On unmount call `monsterIndex.clear()`.

## Tests: `src/game/monsters/spatialHash.test.ts`

- **Brute-force equality:** for seeds 1 to 100, using `createRandom(seed)`: insert 30 random points in `[-10, 10]` (with a few forced on cell borders such as `x = 2`, `x = -2`, `x = 0`), run 40 random queries (radius `0.3` to `8`), and assert the hash result equals a brute-force filter, in insertion order.
- A point exactly at distance `radius` is included; just beyond is excluded.
- Negative coordinates on both sides of zero work.
- `clear()` makes `size` 0 and later queries empty; reinserting after `clear` works.
- `queryRadius` returns the same `out` array it was given, with stale contents removed.
- `nearest` matches brute force, breaks ties by insertion order, and returns null when nothing is in range or the radius is not finite and positive.

And `src/game/monsters/monsterIndex.test.ts`:

- Create three monsters with `createMonster` at known positions; after `rebuildMonsterIndex()`, `monsterIndex.queryRadius` finds exactly the expected ones.
- A monster with `state = 'dead'` is excluded after the next rebuild.
- Remove all test monsters with `world.remove` at the end of each test.

## Acceptance

- [ ] `npm test` passes both files.
- [ ] `spatialHash.ts` has no imports; `monsterIndex.ts` imports only the hash, `monsterQuery`, and the `Entity` type.
- [ ] No `.filter`, `.map`, spread, or object literals inside the per-rebuild or per-query paths.
- [ ] The dev game runs exactly as before: no console errors, no frame-rate change, no visible difference.
- [ ] Every file is under 200 lines; no `any`; no new dependencies.

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Browser: load the dev game, confirm it looks and behaves exactly like 06-03 and the console is clean. Wait for the user's confirmation.

## Not in this task

Using the index for aggro, separation, targeting, or damage; any hero or monster movement; debug drawing. Do not tick the checklist, update the handoff, or commit until the user approves.