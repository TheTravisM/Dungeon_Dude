# 06-02 Monster visual component

**Type:** CODE / VISUAL (browser check required)
**Depends on:** 06-01 approved.
**Rules:** `docs/steps/INDEX.md`. Inspect only the files listed below.

## Goal

Render the three archetypes (slime, skeleton, bat) from grouped primitive boxes, in the same low-poly style and scale as the hero, with a cheap blob shadow. This task makes monsters visible and ready for later tasks. It adds no physics, movement, spawning, or animation.

## Decisions already made (do not reopen)

- Monsters do not cast real shadows. Step 5 leaves exactly one shadow-casting light (the hero torch spotlight) and monsters must not add casters. They use a blob shadow plus `receiveShadow`.
- Model data is a plain data table, so it is unit-testable and the component is thin.
- Materials are per instance (so a later hit flash cannot flash every monster of one type). Geometry is shared.

## Inspect first

- `src/game/monsters/archetypes.ts` (from 06-01: `radius`, `height`).
- `src/components/hero/HeroModel.tsx` for style, materials (`meshStandardMaterial`, roughness 0.85 to 0.95) and size. The hero capsule is `HERO_HEIGHT` 1.05 tall, so monsters stay smaller.
- Heading convention (Step 5 contract): models face local **+Z**, and the visual group takes `rotation.y = Math.atan2(dirX, dirZ)`, which is what `entity.heading` stores. Build every monster facing +Z so 06-05 can reuse that formula.
- `src/components/scene/Lighting.tsx` (read only; the lights are warm and dim, so keep colors mid-dark).
- `src/App.tsx` (where `Dungeon` and `Hero` are mounted, with `CameraFollow` and `InputBridge` from Step 5) and `src/game/dungeon/constants.ts` (`FLOOR_TOP`).

## Create

### 1. `src/game/monsters/monsterParts.ts` (pure, no React or three imports)

```ts
import type { MonsterArchetypeId } from '../../types';

export interface MonsterPart {
  readonly pos: readonly [number, number, number]; // part center, feet at y = 0
  readonly size: readonly [number, number, number];
  readonly color: string;
  readonly emissive?: string; // faint glow, e.g. eyes
}

export const MONSTER_PARTS: Readonly<Record<MonsterArchetypeId, readonly MonsterPart[]>>;
```

Frozen, at most **12 parts** per archetype, feet at y = 0, facing +Z (eyes and front details at positive z). Suggested designs (adjust to look good, but stay within the bounds below):

- **slime** (height 0.6): wide low body `0.56 x 0.36 x 0.56` at y 0.18, a smaller top lump `0.4 x 0.2 x 0.4` at y 0.46, color `#4f8a3c`, a lighter top `#7bb35a`; two small eyes `0.07` cubes at the +Z face, color `#101810`, emissive `#223322`.
- **skeleton** (height 0.9): two thin legs, a ribcage block (`#d8d2bd`), a shoulder bar, a skull `0.22` cube at y 0.85 with two dark eye sockets (`#1a1410`, emissive `#6a2a10`), arms, and a short rusty sword `#7a5a3a` held to one side.
- **bat** (height 0.5, hovers: lowest part at y >= 0.15): small dark body (`#3b2f4a`), head with two red eyes (emissive `#aa2222`), and two flat wing boxes spread left and right at a slight overlap (`#2a2038`).

Bounds rule (enforced by the test): for every part, `|pos.x| + size.x/2` and `|pos.z| + size.z/2` are at most `1.5 * radius` of that archetype, and `pos.y + size.y/2` is at most its `height`, and `pos.y - size.y/2 >= 0`. This keeps models inside one-tile corridors.

### 2. `src/components/monsters/Monster.tsx` (under 120 lines)

```ts
export interface MonsterRig {
  visual: Group;                       // bob / heading / squash target (later tasks)
  materials: MeshStandardMaterial[];   // for hit flash (later tasks)
}
interface MonsterProps {
  archetype: MonsterArchetypeId;
  rigRef?: Ref<MonsterRig>;            // React 19: ref is a normal prop
}
export default function Monster(props: MonsterProps): JSX.Element
```

- One shared module-level `BoxGeometry(1, 1, 1)`; each part is a `<mesh>` with `scale={part.size}`, `position={part.pos}`, `castShadow={false}`, `receiveShadow`.
- Per instance, create materials in `useMemo`, one `MeshStandardMaterial` per unique `color|emissive` pair (`roughness` 0.9; emissive intensity 1 only when `emissive` is set). Dispose them in a `useEffect` cleanup. Do not dispose the shared geometry.
- Structure: `<group>` root, containing `<group ref={visualRef}>` with the part meshes, and a **sibling** blob shadow mesh (so later bobbing and rotation never move the shadow).
- Blob shadow: a `CircleGeometry` (shared, 16 segments) rotated flat (`-Math.PI / 2` on X), at local y `0.012`, radius `archetype.radius * 1.3`, `MeshBasicMaterial` color `#000000`, `transparent`, `opacity 0.35`, `depthWrite={false}`, `toneMapped={false}`, `polygonOffset` with `polygonOffsetFactor -1` to avoid z-fighting with the floor (top at `FLOOR_TOP` 0.06; the monster root will be placed at floor height later).
- Expose `{ visual, materials }` through `useImperativeHandle(rigRef, ...)`.
- No `useFrame`, no state, no ECS access, no Rapier. The root group has no position; the parent places it.

### 3. TEMPORARY `src/components/monsters/MonsterPreview.tsx` (dev only, deleted in 06-03)

- Props: `layout: DungeonLayout`. Renders the three archetypes in a row inside the start room, at `layout.spawn` plus `x` offsets `-1.5, 0, 1.5` and `z + 1.5`, y at `layout.spawn.y`. Add a `// TEMP: removed in 06-03` comment at the top.
- `App.tsx`: one added line inside `<Canvas>` after `<Dungeon>`/`<Hero>` (outside `<GamePhysics>`): `{import.meta.env.DEV && <MonsterPreview layout={layout} />}`. The user authorizes this one temporary edit.

## Tests: `src/game/monsters/monsterParts.test.ts`

- Every archetype id has parts; 1 to 12 parts each.
- Bounds rule above holds for every part of every archetype (use `MONSTER_ARCHETYPES` for `radius` and `height`).
- All colors match `/^#[0-9a-f]{6}$/i`, all sizes are positive, all numbers are finite.
- The table is frozen.

## Acceptance

- [ ] `npm test` passes the new tests.
- [ ] In the dev browser, three clearly different, readable monsters stand in the start room, facing the same +Z direction (toward the camera's lower-right), scaled sensibly next to the hero (all smaller than the hero; the bat floats).
- [ ] Blob shadows are visible, do not flicker or z-fight, and the monsters add no new real shadow casters (`castShadow` is false on every monster mesh).
- [ ] No console errors or warnings; no walls hide a monster oddly.
- [ ] `src/components/monsters/Monster.tsx` and `monsterParts.ts` are each under 200 lines; no `any`; no new dependencies.
- [ ] Production build contains no preview (`import.meta.env.DEV` gate; confirm `npm run build` passes).

## Verify

Run and report the exact result of each: `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`. Then give the user these browser steps and wait for confirmation:

1. `npm run dev`, load the game, let the hero spawn.
2. Look at the three monsters in the start room at the default zoom. Can you tell slime, skeleton, and bat apart at a glance?
3. Are sizes believable next to the hero, and do the dither and tilt-shift keep them readable?
4. Check the blob shadows on the floor for flicker.

## Not in this task

Physics bodies, colliders, movement, heading updates, animation, hit flash, health bars, spawning, or ECS entities (06-03 onward). Do not tick the checklist, update the handoff, or commit until the user approves.
