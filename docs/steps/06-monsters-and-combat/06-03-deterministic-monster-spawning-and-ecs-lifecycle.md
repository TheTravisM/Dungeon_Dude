# 06-03 Deterministic spawning (monsters, key, stairs) and ECS lifecycle

**Type:** CODE / LOGIC (tested) + wiring + visual check
**Depends on:** 06-01 and 06-02 approved.
**Rules:** `docs/steps/INDEX.md`. Inspect only the files listed below.

## Goal

For every dungeon level, deterministically place monsters, one key, and one stairs marker; create them as ECS entities when the level loads; remove them when it unloads; and render them as static objects. Same seed and depth always produce the same placement. Nothing moves, fights, or is picked up yet.

## Decisions already made (do not reopen)

- Monsters: 1 or 2 per room (never in the start room), plus 1 more per 3 depths, capped at 3 per room. Archetypes are picked by seeded, depth-based weights.
- The **stairs** go in the room farthest from the start room. The **key** goes in a different non-start room and is guarded by at least one monster. Hero behavior for the key and stairs is a later Step 6 task; here they only exist.
- Placement is pure data, computed by a React-free module and covered by tests. React only creates entities from the plan and renders them.
- Entity `position` for monsters and markers is the **feet point** (`y = FLOOR_TOP`). Physics bodies in 06-05 derive their own height from it.

## Inspect first

- `src/types/index.ts` (`DungeonLayout`, `DungeonRoom`, `Entity`; check whether `poiType` and `isActive` already exist).
- `src/game/ecs.ts` (`createMonster`, `createProp`, `propQuery`), `src/game/monsters/archetypes.ts`.
- `src/game/dungeon/random.ts` (`createRandom`: `next`, `int`, `chance`, `pick`), `src/game/dungeon/constants.ts` (`gridToWorld(coordinate, size)`, `FLOOR_TOP`).
- `src/game/dungeon/getDungeonLayout.ts`, `src/App.tsx`, `src/components/monsters/MonsterPreview.tsx` (to delete).
- Facts to rely on: `layout.rooms[0]` is the start room and `layout.spawn` is its center. Rooms have `x, z, width, depth, center` in grid cells. `layout.floorCells` lists every floor cell. `createRandom(seed)` is deterministic.

## Authorized edits (protected files; exactly these)

1. `src/types/index.ts`: only if missing, add to `Entity`:
   ```ts
   poiType?: 'loot' | 'key' | 'stairs' | 'enemy';
   isActive?: boolean; // false once picked up or used
   ```
2. `src/game/ecs.ts`: add, without touching hero, monster, or prop factories:
   ```ts
   export const poiQuery = world.with('poiType', 'position', 'isActive');
   export function createPoi(position: Vector3, poiType: 'key' | 'stairs'): Entity
   // world.add({ id: nextEntityId('poi'), position: position.clone(), state: 'idle', poiType, isActive: true })
   ```
3. `src/App.tsx`: delete the temporary `MonsterPreview` line and import; add `<LevelEntities layout={layout} />` inside `<Canvas>`, outside `<GamePhysics>`.

No package changes.

## Create

### 1. `src/game/monsters/spawnPlan.ts` (pure; no React, no three, no ECS)

```ts
export interface SpawnPoint { cell: GridCell; roomIndex: number }
export interface MonsterSpawn extends SpawnPoint { archetype: MonsterArchetypeId }
export interface SpawnPlan { monsters: MonsterSpawn[]; key: SpawnPoint; stairs: SpawnPoint }

export const MAX_MONSTERS_PER_ROOM = 3;
export function archetypeWeights(depth: number): Readonly<Record<MonsterArchetypeId, number>>;
export function planSpawns(layout: DungeonLayout, depth: number): SpawnPlan;
```

Rules (all in this file; constants named and exported where a test needs them):

- **Rooms.** Start room is index 0. Candidate rooms are the others.
- **Stairs room.** The candidate room whose center has the greatest Manhattan distance from `rooms[0].center`; ties go to the lowest index.
- **Key room.** From the candidate rooms other than the stairs room, pick one with `createRandom(layout.seed ^ 0x6b79e5a3).pick(...)`. Dungeons have 4 to 6 rooms, so one always exists; if there are fewer than 3 rooms in total, put the key in the stairs room on a different cell.
- **Per-room RNG.** For every room use its own generator: `createRandom(((layout.seed ^ 0x51a7b3c9) + Math.imul(roomIndex + 1, 0x9e3779b1)) >>> 0)`. This makes each room's result independent, so changing depth never reshuffles other rooms.
- **Cells.** Candidate cells for a room are its cells (`x..x+width-1`, `z..z+depth-1`) minus the room center (the hero's exploration goal), minus the key and stairs cells. Choose without repeats, via the room's RNG. Skip any cell not in `layout.floorCells`.
- **Count.** `base = 1 + (rng.chance(0.5) ? 1 : 0)`, `count = Math.min(MAX_MONSTERS_PER_ROOM, base + Math.floor((depth - 1) / 3))`. The key room gets at least 1. Never more than the candidate cells available.
- **Archetype weights** (`archetypeWeights`): depth 1: slime 3, skeleton 1, bat 0; depths 2 to 3: 2, 2, 1; depth 4 and up: 1, 2, 2. Pick with `rng.next()` against the cumulative weights.
- **Key and stairs cells.** Pick each from its room's cells (excluding the center) with that room's RNG, taken before the monsters so the cell is reserved.
- Output arrays are ordered by room index, then placement order, so the result is stable.

### 2. `src/hooks/useLevelEntities.ts`

```ts
export function useLevelEntities(layout: DungeonLayout, depth: number): { monsters: Entity[]; pois: Entity[] }
```

- In `useEffect` keyed on `layout` and `depth`: compute `planSpawns`, create the entities (`createMonster(new Vector3(gridToWorld(cell.x, layout.size), FLOOR_TOP, gridToWorld(cell.z, layout.size)), archetype, { depth, roomIndex })`, `createPoi(...)`), keep them in a local array, `setState` once with the arrays, and in the cleanup remove **every** entity this effect created with `world.remove`, then set empty state. React StrictMode runs the effect twice in dev; after both cycles there must be exactly one set of entities (no leaks, no duplicates).
- One state update per level load is allowed; there are no per-frame writes and no Zustand use.
- Read the depth with `useGameStore((s) => s.currentDepth)` in the component, not in the hook.

### 3. `src/components/level/LevelEntities.tsx` (returns the scene content; under 80 lines)

- Props: `{ layout: DungeonLayout }`. Calls the hook, then renders `monsters.map` as `<group key={e.id} position={e.position.toArray()}><Monster archetype={e.archetype} /></group>` (static for now; 06-05 replaces this with moving instances) and `pois.map` as `<PoiMarker key={e.id} kind={e.poiType} position=... />`.

### 4. `src/components/level/PoiMarker.tsx` (under 80 lines)

- Key: a small gold box-and-ring made of at most 4 meshes, floating at y 0.35, `meshStandardMaterial` color `#d9b04a` with a warm emissive, `castShadow={false}`.
- Stairs: three stacked flat boxes (steps) in a dark stone color `#4a4d5a` with a thin cool-blue glow plate `#6fa8ff` (`meshBasicMaterial`, `toneMapped={false}`) so it reads in the dark.
- No `useFrame`, no state, no lights.

### 5. Delete `MonsterPreview.tsx`.

## Tests: `src/game/monsters/spawnPlan.test.ts`

Use `generateDungeon(seed)` from `src/game/dungeon/generateDungeon.ts` for seeds 1 to 200 and depths 1, 4, and 7. Assert:

- Determinism: `planSpawns` called twice returns deep-equal plans.
- No monster, key, or stairs lies in room 0.
- Every cell is inside its stated room and in `layout.floorCells`; none is the room center.
- No two spawn points (monsters, key, stairs) share a cell.
- Stairs room differs from key room, and the stairs room is the farthest by Manhattan distance from the start center (ties to lowest index).
- The key room contains at least 1 monster.
- Monsters per room are between 1 and `MAX_MONSTERS_PER_ROOM`, except the start room (0). If a room has too few cells to satisfy the minimum, the test accepts fewer, but never zero for the key room.
- A room's total at depth 7 is at least its total at depth 1 for the same seed.
- `archetypeWeights(1).bat === 0`, and all weights are non-negative integers for depths 1 to 20.

## Acceptance

- [ ] `npm test` passes.
- [ ] In the dev browser on the default seed, every non-start room has 1 to 2 static monsters, with a key marker and a stairs marker in two different rooms.
- [ ] Reloading the page, and switching to another seed or depth, produces the same layout for the same seed and a clean replacement for a different one. Check with the existing dev controls if present.
- [ ] After the StrictMode double mount, there is no duplicated monster stack on the same cell (look for brighter, doubled shadows).
- [ ] `monsterQuery` and `poiQuery` sizes match the plan (verify through a temporary one-line dev log, then remove it).
- [ ] No console errors or warnings. Every file is under 200 lines, with no `any` and no new dependencies.
- [ ] `MonsterPreview.tsx` and its mount are gone.

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Then give the user these browser steps and wait for confirmation:

1. `npm run dev`; walk or watch the hero explore a few rooms.
2. Confirm monsters sit on floor tiles in rooms (never in corridors, never in the start room) and do not overlap each other or the markers.
3. Confirm the key and stairs markers are visible in the dark and in different rooms.
4. Reload twice; the layout must be identical each time.

## Not in this task

Monster physics, movement, AI, the spatial hash, hero attacks, picking up the key, using the stairs, damage, or any HUD. Do not tick the checklist, update the handoff, or commit until the user approves.
