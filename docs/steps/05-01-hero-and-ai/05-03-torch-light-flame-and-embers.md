# 05-03 Torch light, flame, and embers

**Type:** CODE / VISUAL
**Depends on:** 05-02 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 3, 6.6, 6.7, and 7 only.

## Goal

The hero's torch becomes the main light: a flickering warm light with real moving shadows, a small flame, and rising embers. Efficient by design: one shadow map, not six.

## Inspect first

`src/components/hero/HeroModel.tsx` (the `torchHand` group), `src/components/scene/Lighting.tsx` (key light 3.4, ambient 1.1), `src/components/canvas/` setup (confirm `shadows` is enabled on the Canvas; if not, enable it there), `src/game/constants.ts` (color tokens if any).

## Create and edit

1. `src/hooks/hero/useTorchFlicker.ts`:
   ```ts
   export function useTorchFlicker(opts: {
     spot: RefObject<SpotLight | null>;
     glow: RefObject<PointLight | null>;
     flame: RefObject<Mesh | null>;
   }): void
   ```
   One `useFrame` that sets intensity from a sum of two or three sines at unrelated frequencies (about 7, 13, 23 Hz) plus a slow 0.7 Hz swell, for roughly plus or minus 18 percent around the base. Write `.intensity` and the flame's `scale` directly through refs. No React state, no `Math.random()` per frame (the result must not jitter into noise), no allocations in the loop.
2. `src/components/hero/HeroTorch.tsx`, rendered inside the `torchHand` group (portal via the rig ref is not needed: export a component that `HeroModel` renders inside `torchHand`):
   - `<spotLight ref castShadow color="#ffb25a" intensity={base} angle={Math.PI / 2.4} penumbra={0.9} distance={14} decay={1.6} position={[0, 0.1, 0]} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-normalBias={0.03} shadow-camera-near={0.1} shadow-camera-far={14} />`
   - A sibling `<object3D ref={targetRef} position={[0, -1.3, 0.4]} />` and a layout effect `spot.target = targetRef.current` (contract 6.6). The target is aimed at the floor in front of and below the torch so the cone covers the floor around the hero.
   - `<pointLight ref color="#ff9a3c" intensity={...} distance={6} decay={2} />` with `castShadow` OFF, for a soft warm fill so the hero's own surroundings never go black.
   - Flame: a small `<mesh>` (octahedron or cone, radius about 0.07) with `meshBasicMaterial` color `#ffcf70`, `toneMapped={false}`, `castShadow={false}`.
   - Embers: Drei `<Sparkles count={14} speed={0.6} size={3} scale={[0.25, 0.8, 0.25]} color="#ff8a2a" opacity={0.9} noise={0.6} position={[0, 0.3, 0]} />`.
3. `src/components/hero/HeroModel.tsx`: render `<HeroTorch />` as a child of the `torchHand` group. This is the only change to that file.
4. `src/components/scene/Lighting.tsx`: lower the existing ambient and key lights only as far as needed so the torch pool is clearly visible. Start by multiplying both intensities by 0.6. Keep a cold blue ambient. Record the final values in a comment.

## Spec notes

- Only the spot light casts shadows. Never add `castShadow` to the point light.
- Shadow-casting walls must be set to `castShadow` and the floor `receiveShadow`. Check `DungeonWalls.tsx` and `DungeonFloor.tsx`. If instanced meshes need the flags, add only those flags.
- If shadow acne or peter-panning appears, adjust `shadow-bias` and `shadow-normalBias` by small steps, one at a time.
- Total draw cost matters: do not raise the shadow map above 1024 without asking.

## Acceptance

- [ ] A warm cone of light surrounds the hero; the rest stays cold blue-grey but legible.
- [ ] Walls cast visible shadows that shift as the flicker moves.
- [ ] Flame and embers are visible at the game camera.
- [ ] Flicker is smooth, not strobing. There is no per-frame allocation in `useTorchFlicker`.
- [ ] Exactly one light has `castShadow`. The Dev panel or `renderer.info` shows no jump in draw calls beyond the shadow pass.
- [ ] 60 fps holds in the start room on the user's machine.

## Verify

INDEX commands, then browser. The hero is still stationary, so look at the pool and shadows from a few seeds. Ask the user to confirm brightness and mood by eye, and report the final Lighting numbers.

## Not in this task

Wall torches, braziers, dust motes, post-processing, movement.
