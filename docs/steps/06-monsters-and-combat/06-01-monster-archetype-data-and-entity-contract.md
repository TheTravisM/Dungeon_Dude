# 06-01 Monster archetype data and entity contract

**Type:** CODE / DATA (pure, tested; no rendering, spawning, or AI)
**Depends on:** Step 5 (the `docs/steps/05-hero-and-ai` plan) built, so `src/game/hero/constants.ts` exists. If it does not, stop and report.
**Rules:** `docs/steps/INDEX.md`. Inspect only the files listed below.

## Goal

Define the three monster archetypes as immutable data, extend the monster entity with the few mutable fields combat needs, and give `createMonster` a stable shape per archetype. Nothing renders, spawns, moves, or attacks yet.

## Decisions already made (do not reopen)

- Three archetypes: **slime** (slow, tanky), **skeleton** (balanced), **bat** (fast, fragile).
- Hero attacks automatically and on `Space`; monsters use Rapier kinematic character controllers and `mistreevous` (later tasks).
- Stats live in a frozen table. The entity stores only mutable state and an archetype id.
- Time fields are absolute milliseconds from one clock (`performance.now()`), never frame counts.

## Inspect first

- `src/game/ecs.ts` (`createMonster`, `monsterQuery`). Run `grep -rn "createMonster" src tests` and list every caller; update them in this task.
- `src/types/index.ts` (`Entity`).
- `src/game/dungeon/random.ts` and `constants.ts` (for naming style only).
- `src/game/hero/constants.ts` (`HERO_SPEED` is 3.0, `HERO_RADIUS` 0.28). Read it, do not edit it.
- `vitest.config.ts`: tests are `src/**/*.test.ts`, node environment. Tests live next to their module; do not create a `tests/` folder.

## Authorized edits (this task only)

`src/types/index.ts` and `src/game/ecs.ts` are protected; the user authorizes exactly the edits below and nothing else. No package changes.

### 1. `src/types/index.ts`

Add above `Entity` and inside `Entity`:

```ts
export type MonsterArchetypeId = 'slime' | 'skeleton' | 'bat';
```

```ts
  // Monster data (Step 6). Stats come from the archetype table, not the entity.
  archetype?: MonsterArchetypeId;
  roomIndex?: number;        // index into DungeonLayout.rooms where it spawned
  attackReadyAt?: number;    // ms; the next swing may start at or after this
  hurtUntil?: number;        // ms; hit-flash and invulnerability window end
```

Do not change any existing field. `state` already has `'idle' | 'patrol' | 'chase' | 'attack' | 'dead'`; the wind-up is part of `'attack'`.

### 2. New file `src/game/monsters/archetypes.ts` (no React, no three imports)

```ts
import type { MonsterArchetypeId } from '../../types';

export interface MonsterArchetype {
  readonly id: MonsterArchetypeId;
  readonly label: string;
  readonly maxHealth: number;
  readonly attackPower: number;
  /** World units per second. Must stay below HERO_SPEED (3.0). */
  readonly moveSpeed: number;
  /** Tiles. Distance at which the monster notices the hero. */
  readonly aggroRange: number;
  /** Tiles, center to center. Distance at which a swing may start. */
  readonly attackRange: number;
  readonly attackWindupMs: number;
  readonly attackCooldownMs: number;
  /** Capsule radius. Corridors are one tile wide, so keep <= 0.3. */
  readonly radius: number;
  readonly height: number;
  readonly gold: number;
}
```

Export `MONSTER_ARCHETYPES: Readonly<Record<MonsterArchetypeId, MonsterArchetype>>`, built with `Object.freeze` at both levels, with these values (these are the starting tuning; keep them as plain numbers so they are easy to adjust):

| id | maxHealth | attackPower | moveSpeed | aggroRange | attackRange | windup ms | cooldown ms | radius | height | gold |
|---|---|---|---|---|---|---|---|---|---|---|
| slime | 30 | 8 | 1.0 | 4 | 0.9 | 600 | 1400 | 0.3 | 0.6 | 2 |
| skeleton | 20 | 12 | 1.8 | 6 | 1.0 | 500 | 1100 | 0.26 | 0.9 | 4 |
| bat | 10 | 6 | 2.6 | 7 | 0.8 | 350 | 800 | 0.22 | 0.5 | 3 |

(The hero has 100 health and 10 attack power and walks at 3.0, so a slime takes 3 hits, a skeleton 2, a bat 1.)

Also export:

```ts
export const MONSTER_ARCHETYPE_IDS: readonly MonsterArchetypeId[]; // ['slime','skeleton','bat'], frozen
export function scaleStat(base: number, depth: number): number;
```

`scaleStat` returns `Math.round(base * (1 + 0.15 * (Math.max(1, depth) - 1)))`. It is the single place depth scaling lives; later tasks call it for health and attack power. Depth 1 returns the base value unchanged.

### 3. `src/game/ecs.ts`

Replace `MonsterOptions` and `createMonster` with:

```ts
interface MonsterOptions {
  depth?: number;      // defaults to 1; scales health and attack power
  roomIndex?: number;  // defaults to -1 (not tied to a room)
}

export function createMonster(
  position: Vector3,
  archetype: MonsterArchetypeId,
  options: MonsterOptions = {}
): Entity
```

- Read stats from `MONSTER_ARCHETYPES[archetype]`; health and `maxHealth` are `scaleStat(maxHealth, depth)`, `attackPower` is `scaleStat(attackPower, depth)`.
- Initial object always contains exactly: `id`, `isMonster: true`, `position` (cloned), `velocity: [0, 0, 0]`, `health`, `maxHealth`, `attackPower`, `state: 'idle'`, `heading: 0`, `archetype`, `roomIndex`, `attackReadyAt: 0`, `hurtUntil: 0`. The same keys for every archetype, so entities never change archetype later.
- Keep `monsterQuery` as is. Touch nothing else in the file (hero and prop factories stay unchanged).

## Tests: `src/game/monsters/archetypes.test.ts`

Use `import { describe, expect, it } from 'vitest'`. Cases:

- Every id in `MONSTER_ARCHETYPE_IDS` exists in the table and `table[id].id === id`.
- All numeric fields are finite and greater than zero.
- `aggroRange > attackRange` for every archetype.
- `moveSpeed < HERO_SPEED` for every archetype (import `HERO_SPEED` from `../hero/constants`).
- `radius <= 0.3` for every archetype.
- The table and each entry are frozen (`Object.isFrozen`), and assigning to a field throws in strict mode or leaves the value unchanged.
- `scaleStat(30, 1) === 30`, is non-decreasing for depths 1 to 20, and `scaleStat(30, 0)` equals the depth 1 value.
- `createMonster` for all three archetypes returns entities with identical key sets (`Object.keys(...).sort()`), `health === maxHealth`, `state === 'idle'`, and a cloned position (mutating the input vector does not move the entity).
- `createMonster(pos, 'skeleton', { depth: 3 }).maxHealth === scaleStat(20, 3)`.
- Each test that creates a monster removes it with `world.remove(entity)` afterward so `monsterQuery.size` returns to its starting value.

## Acceptance

- [ ] `src/game/monsters/archetypes.ts` is under 100 lines, has no React or three imports, and no `any`.
- [ ] All three archetypes have the values above, are frozen, and are typed.
- [ ] `createMonster` has the new signature; every old caller is updated and none remains with the old options.
- [ ] `heroQuery`, `propQuery`, `createHero`, and `createProp` are unchanged (`git diff` shows only the monster factory and the new type lines in the two protected files).
- [ ] `package.json` and the lockfile are unchanged.
- [ ] No spawn, render, movement, or combat code is added.

## Verify

Run, and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. No browser check is needed.

## Not in this task

Monster visuals, spawning, key or stairs placement, the spatial hash, movement, hero attack, damage, or any HUD. Do not tick the checklist, update the handoff, or commit until the user approves.
