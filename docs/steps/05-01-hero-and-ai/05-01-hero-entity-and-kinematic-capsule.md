# 05-01 Hero entity and kinematic capsule

**Type:** CODE / PHYSICS
**Depends on:** 05-00 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2, 3, 6.2, 6.3, and 7 only.

## Goal

Put exactly one hero entity in the ECS world and one kinematic Rapier body with a grounded capsule at the generated spawn point. The visual is a temporary box. No movement yet.

## Inspect first

`src/game/ecs.ts` (`createHero`, `heroQuery`), `src/components/dungeon/Dungeon.tsx`, `src/components/dungeon/DungeonCollider.tsx`, `src/App.tsx`, `src/main.tsx` (StrictMode is on).

## Create and edit

1. `src/game/hero/constants.ts`: the constants block from contract section 3, copied exactly, with a one-line doc comment on each group explaining why (corridor width, feet-origin convention).
2. `src/hooks/hero/useHeroEntity.ts`:
   ```ts
   export function useHeroEntity(spawn: Position): void
   ```
   One `useEffect` keyed on `spawn.x, spawn.y, spawn.z`. It calls `createHero(new Vector3(spawn.x, spawn.y, spawn.z))` and returns a cleanup that calls `world.remove(entity)` on that exact entity. Do not use Zustand or `useState`. Do not create another World.
3. `src/components/hero/Hero.tsx`: props `{ layout: DungeonLayout }`. Calls `useHeroEntity(layout.spawn)` and renders per contract 6.2:
   - `<RigidBody type="kinematicPosition" colliders={false} canSleep={false} position={[spawn.x, spawn.y, spawn.z]}>`
   - `<CapsuleCollider args={[HERO_CAPSULE_HALF_HEIGHT, HERO_RADIUS]} position={[0, HERO_CAPSULE_CENTER_Y, 0]} />`
   - A temporary `<mesh>` child: box `0.4 x 0.9 x 0.4`, centered at local `y = 0.45`, `meshStandardMaterial` color `#c9a227`, `castShadow`. Mark it with a `TEMP: replaced in 05-02` comment.
   - Keep `bodyRef` and `colliderRef` declared (typed `RapierRigidBody` and `RapierCollider`) for 05-05, but do not use them yet. If lint objects to unused refs, defer declaring them to 05-05.
4. `src/App.tsx`: mount `<Hero key={layout.seed} layout={layout} />` inside `<GamePhysics>` directly after `<Dungeon layout={layout} />`. Change nothing else.

## Acceptance

- [ ] The box stands on the center of the start room, resting on the floor, not sunk and not floating.
- [ ] With physics debug on (Dev panel, "Physics colliders"), the capsule wireframe sits entirely inside the room with its bottom a hair above the floor.
- [ ] `heroQuery.size === 1` after mount under StrictMode, and 1 again after a hot reload.
- [ ] Changing `VITE_DUNGEON_SEED` and restarting puts the hero in that seed's start room.
- [ ] No Zustand or React state holds position data. `Hero.tsx` stays under 200 lines.

## Verify

INDEX commands, then browser:
1. `npm run dev`, open the Dev panel, enable "Physics colliders". Confirm the capsule and the resting box.
2. Add a temporary `console.info('hero count', heroQuery.size)` in a `useEffect` in `Hero.tsx`, confirm it prints 1, then remove it before finishing.
3. Ask the user to confirm the spawn position looks right.

## Not in this task

Any movement, input, model detail, light, or animation.
