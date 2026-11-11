# 05-02 Hero visual model

**Type:** CODE / VISUAL
**Depends on:** 05-01 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 2 and 3 only.

## Goal

Replace the temporary box with a clearly built adventurer made from grouped primitive boxes, rigged with named groups so later tasks can animate it. Rendering only: no movement, no hooks that move things, no lights.

## Inspect first

`src/components/hero/Hero.tsx`, `src/game/hero/constants.ts`, `src/components/dungeon/DungeonWalls.tsx` (material conventions: `meshStandardMaterial`, roughness about 0.9, low metalness, muted colors).

## Create and edit

1. `src/hooks/hero/useHeroRig.ts`: returns an object of typed refs, created with `useRef<Group>(null)`:
   `root, hips, torso, cloak, head, legLeft, legRight, armSword, armTorch, torchHand`.
   Export the `HeroRig` type. It is only refs; no logic.
2. `src/components/hero/HeroModel.tsx`: props `{ rig: HeroRig }`. Pure rendering. Feet at local `y = 0`, facing local `+Z`, total height about `HERO_HEIGHT` plus the raised torch arm. Suggested structure and sizes (adjust by eye, keep the hierarchy and names):
   - `root` (will receive heading) contains `hips` at `y = 0.50`.
   - `hips` contains: `torso` box `0.34 x 0.40 x 0.22` at `y = 0.22` (steel blue-grey `#566070`, metalness 0.3); `cloak` box `0.38 x 0.52 x 0.07` hanging behind the torso at `z = -0.15` (dark `#2b2f3a`); `head` group at `y = 0.56` with a skin box `0.20` and a hood box `0.26 x 0.26 x 0.28` around it (hood `#23262f`, open toward `+Z`); `legLeft` and `legRight` groups pivoting at `x = +/-0.09`, `y = 0`, each a box `0.12 x 0.50 x 0.14` hanging down from the pivot (boots darker at the bottom); `armSword` pivot at `x = +0.23, y = 0.36` with an arm box and a sword box (blade `0.05 x 0.05 x 0.55` pointing `+Z`, bright steel, plus a small cross-guard); `armTorch` pivot at `x = -0.23, y = 0.36`, rotated so the forearm points up, ending in `torchHand` at about `y = 1.35` above the feet.
   - Every mesh `castShadow`. Do not set `receiveShadow` on the small parts.
   - Leave `torchHand` empty except for a short wooden torch stick box. The flame and lights arrive in 5.03.
3. `src/components/hero/Hero.tsx`: call `useHeroRig()`, render `<HeroModel rig={rig} />` inside the `RigidBody` instead of the temporary box, and delete the box.

## Spec notes

- The silhouette must read at the current camera (zoom 40: the hero is only about 42 px tall). Exaggerate: a large hood, a bright steel blade, a distinct cloak. Keep it inside the capsule footprint so it never visibly clips walls in a one-tile corridor.
- Use at most about 14 meshes. No textures, no external assets, no new dependencies.
- Colors stay cold and desaturated except the torch (added later) and a small warm accent such as a belt or hood trim.

## Acceptance

- [ ] The hero reads as a hooded, armored figure with a sword hand and a raised torch arm from the fixed camera.
- [ ] The model stands on the floor and fits inside the debug capsule.
- [ ] `HeroModel.tsx` contains no state, no `useFrame`, and no movement code, and stays under 200 lines.
- [ ] All rig refs are attached to the groups named above (verify by logging `Object.values(rig).every(r => r.current)` once in a temporary effect, then remove it).

## Verify

INDEX commands, then browser: view the hero in the start room, then in a corridor. Ask the user to confirm the look.

## Not in this task

Animation, facing, torch flame, lights, movement.
