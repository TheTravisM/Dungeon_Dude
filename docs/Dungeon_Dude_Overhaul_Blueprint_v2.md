# Dungeon Dude Visual Overhaul: Blueprint v2

**Executor:** DeepSeek V4 (coding agent)
**Supersedes:** `Dungeon_Dude_Diorama_Overhaul_Blueprint.md` (v1) and `Gemini-Overhaul.md`. Where they conflict, follow this file.
**Repo:** https://github.com/TheTravisM/Dungeon_Dude | **Live:** https://dungeon-dude.vercel.app/
**Stack:** React, Vite, TypeScript, Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@react-three/rapier`, Miniplex ECS, Zustand.
**Platform:** mobile browsers. Must hold 60 fps on a mid-range phone.

---

## 0. Situation and goals

### 0.1 Current state

- All original plan Steps 1 to 7 are complete and working: autoplay, manual override, monsters, combat.
- Step 8 (audio and TTS) is deferred. Do not touch it.
- **Do not change gameplay, AI, controls, or the existing lighting.** The torch lighting is approved as is.

### 0.2 What must change (the visual problems)

1. **Blocky look.** The hero reads as a Minecraft figure. The room walls and floors are perfect squares with flat textures, which reads as blocks with paint.
2. **Walls:** perfect 90-degree edges. They need chipped, beveled, irregular stone.
3. **Floor:** should read as real tile, with slight unevenness.
4. **Palette:** cold. Dark grays, blues, and hints of purple in the stone and ambient light. The torch is the one warm element: warm orange against cold stone. Rich color, strong contrast between light and dark.
5. **Camera:** keep the current layout exactly. Push the tilt-shift miniature effect further. Edges of the view fade to near black, like Diablo 1.
6. **Hero:** replace the Minecraft-style character with a detailed knight. Spec below.

### 0.3 Hero spec (the user's words, condensed)

- Hooded knight. **Red hooded cowl** covering head and face.
- **Large shield on his back.**
- **Wide, large sword in his right hand.**
- **Flickering burning torch in his left hand.**
- **Left arm in heavy plate armor, with a large metal pauldron on the left shoulder.**
- Rest of the body: leather armor.
- **Large brown leather boots.**
- Keep it simple. Realistic but stylized. Must look good on a phone.

### 0.4 Hero approach (decided)

**Mixamo base plus add-on pieces.** The base is the Mixamo "Paladin W/Prop J Nordstrom" rig, which supplies the skeleton and the Idle and Run animations. The Paladin probably does **not** have the red cowl, the back shield, or the left pauldron, so those are added as separate pieces attached to bones. This is a kitbash: a body plus attachments. Pull each piece from a library before writing any custom geometry.

### 0.5 Wall approach (decided)

**Library stone-block .glb, instanced.** Use a CC0 chipped or beveled stone block with irregular edges. Instance it across the map. Do not use procedural box-jitter as the main look.

### 0.6 Torch approach (decided)

**Keep the existing torch light.** Read its color, intensity, distance, and decay from the current code in Phase 0, and reuse those numbers. Only add a subtle flicker and attach the light to the torch bone. Do not change its brightness or falloff.

### 0.7 Working rules

- **Library first.** Before writing any custom geometry, texture, or shader, check for a CC0 or permissively licensed asset (Poly Haven, ambientCG, Kenney, Quaternius, Mixamo, CC0 Sketchfab). Record the source and license of each asset in `docs/ASSETS.md`. Write custom code only when nothing suitable exists, and say so in the handoff.
- Follow the repo rules in `.cursorrules`: 200 lines per file max, no `useState` for fast-changing values, Rapier for all collision, shared types in `src/types/index.ts`, conversational JSDoc explaining the why, no emojis or icons in comments.
- The "Read and Ask" step in those rules is waived. All decisions here are final. Ask only if truly blocked.
- **One micro-step at a time.** Never combine steps in one edit. After each: `npx tsc --noEmit`, `npm run lint`, `npm run build`. On visual steps, state what to look for in the browser.
- Report in 3 lines or fewer: what changed, what to look at, what is next. Commit after the user confirms. Add one line per completed micro-step to `AI_HANDOFF.md`.
- No dependencies beyond those named here. Do not paste whole files into chat.

### 0.8 Global rules (apply everywhere)

| ID | Rule |
|----|------|
| G1 | No React `setState` or re-rendering store updates inside `useFrame`. Mutate refs and ECS entities. |
| G2 | No allocation in `useFrame` (no `new Vector3`, no literals). Use module-level scratch objects. |
| G3 | Create geometry, materials, and textures once (`useMemo` or module level). Never dispose cached `useGLTF` geometry. |
| G4 | Constant light count. Exactly one dynamic light (the torch) plus the existing ambient/fill lights. Do not add lights at runtime. |
| G5 | **No shadow maps.** No `castShadow`, `receiveShadow`, `shadows`, or `shadow-*` anywhere. |
| G6 | Postprocessing effects get stable props. Live values go through the effect ref, not props. |
| G7 | Quality tier only goes down (high to low), never back up. |
| G8 | Deterministic procedural variation from a seed, never `Math.random()` in environment code. |
| G9 | Physics owns collision. Visual jitter, tilt, and scale stay out of colliders. |
| G10 | Every `useGLTF` or `useTexture` consumer sits inside `<Suspense>`. Preload models. |
| G11 | Measure. Dev-only `<Stats />` and a `renderer.info` log. |
| G12 | No regressions to autoplay, manual override, monsters, combat, or the existing torch brightness. |

---

## 1. Phase 0: Recon (no code changes)

Write an "Overhaul baseline" section into `AI_HANDOFF.md` with:

1. Installed versions of `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `@react-three/rapier`, `miniplex`, `zustand`.
2. Canvas props, camera type, position, zoom, near and far.
3. **Current torch light values:** color, intensity, distance, decay, and its position. Record them verbatim. These become the constants the torch must keep.
4. Current ambient and fill lights, with their colors and intensities.
5. Current `Effects.tsx` contents.
6. How the dungeon grid is stored (type, dimensions, cell values) and what renders it.
7. How the hero is built: body type, `KinematicCharacterController` wiring, ECS fields.
8. Every `castShadow`, `receiveShadow`, `shadows`, `shadow-` occurrence.
9. Baseline on desktop: draw calls, triangles, and FPS from `renderer.info`.

Output: the baseline section only. No source edits.

---

## 2. Phase 1: Asset Sourcing and Pipeline

**Goal:** every asset is library-sourced, licensed, optimized for phones, and loaded through one config.

### 2.1 Manual steps (the user does these; DeepSeek writes the checklist)

Produce `docs/ASSET_PIPELINE.md` with this list, then stop and wait for the user to confirm the files are in `assets-src/`.

**Hero base (Mixamo, Adobe login required):**
1. Characters tab: "Paladin W/Prop J Nordstrom". Download FBX Binary, T-pose, with skin.
2. Preview the model. Note which pieces it already has: hood, shield, pauldron, cape. **Report this to Claude before the add-on pieces are sourced.**
3. Animations tab: an **Idle** clip and a **Run** clip. Use "Sword And Shield" versions if they exist. Download each as FBX Binary, Without Skin, 30 fps. On Run, enable **In Place**.

**Hero add-ons (CC0 or permissive, pulled from a library):**
4. A **large round or kite shield** for the back.
5. A **plate pauldron** for the left shoulder.
6. A **hood or cowl**. Red cloth color is a material setting. If no matching hood model exists, look for a cloak or hood mesh that can be recolored.
7. A **sword**, wide and large, for the right hand. A **torch** model for the left hand (a small handle with a flame mesh, or a plain handle with the light supplying the flame).
8. **Boots** and **leather body**: use the Paladin's own body if it fits. Otherwise a CC0 leather armor piece.

Record the source, license, and author of every piece in `docs/ASSETS.md`.

**Environment (CC0):**
9. **Wall block:** one chipped, beveled stone block `.glb`. Irregular edges. Budget 300 triangles max. Source: Poly Haven models, Kenney, or a CC0 Sketchfab model.
10. **Floor tile:** one stone flagstone `.glb` with slightly irregular edges. Budget 100 triangles max. If none is suitable, use one `RoundedBoxGeometry` (from `three/examples/jsm/geometries/RoundedBoxGeometry.js`) with a small bevel.
11. **Textures (CC0, Poly Haven or ambientCG), 2K source:**
    - Walls: dark rough rock. Color, Normal (OpenGL), Roughness.
    - Floor: dark flagstone or cold tile. Color, Normal (OpenGL), Roughness.
    - Palette: cool, desaturated grays and blue-gray. Keep color maps desaturated so the torch is the only warm color.

**Housekeeping:** raw downloads go in `assets-src/`, which is git-ignored. Ship only optimized files. The user should confirm current Mixamo and Adobe terms before redistributing any model.

### 2.2 Optimization script

`scripts/optimize-assets.mjs` (Node, cross-platform, no bash):
- Dev dependencies: `@gltf-transform/cli`, `sharp`.
- Textures: convert to `.webp`, max 1024 px (512 for the floor if quality holds), into `public/textures/`.
- Models: `gltf-transform optimize` with meshopt. If meshopt breaks a skinned model, skip meshopt for that file.
- Print a size report. Targets: each character under about 3 MB, environment and textures together under about 3 MB.

### 2.3 Asset registry

`src/config/assets.ts` is the only place for asset URLs and names: model URLs, texture URLs, `CLIP_IDLE = 'Idle'`, `CLIP_RUN = 'Run'`, and the bone names used for attachments (verified in Phase 4). Use Vite URL imports so filenames are hashed for caching on Vercel.

### 2.4 Acceptance gate

- [ ] All files exist, are logged in `docs/ASSETS.md`, and are within size targets.
- [ ] A temporary dev route shows the base model and logs its clip names (must include Idle and Run). Remove the route afterward.
- [x] Build passes. Gameplay unchanged.

---

## 3. Phase 2: Camera, Post-Processing, Palette

**Goal:** same camera layout, stronger miniature tilt-shift, edges fade to black, cold palette with a warm torch.

### 3.1 Camera (keep the layout)

- **Do not change** the camera angle, the position relative to the board, or the zoom behavior the user already likes. Phase 0 records them. Only tighten `near` and `far` to fit the scene, which does not change the look.
- The hero stays at screen center. The edge fade is screen-centered, so the hero must never drift toward the edge.

### 3.2 Composer and effects

Hooks and APIs: `EffectComposer`, `DepthOfField`, `Vignette`, `TiltShift2` (lower tier), `ToneMapping`, `useFrame`, `useThree`, drei `PerformanceMonitor`, drei `useDetectGPU`.

**Composer:** `<EffectComposer multisampling={0}>`. Anti-aliasing comes from the blur and the dpr cap. Add a tone mapping effect only if colors go flat (see 3.4).

**Depth of field (high tier) — the stronger tilt-shift:**
- Check the installed `@react-three/postprocessing` types first. DoF props changed across versions (normalized 0 to 1 versus world units). Use the variant the installed version supports.
- Start with a **narrow focus band** so the hero and the tiles right around him are sharp, and everything farther away softens fast. This is the "macro lens on a board" look.
- Start `bokehScale` around 4 and `resolutionScale` around 0.5, then tune by eye. All values live in `src/config/dioramaConfig.ts`.
- Track the hero: pass a stable Vector3 as the autofocus target, then copy the hero's world position into the **effect ref** each frame (not the prop, per G6).

**Vignette (edge fade to black):**
- `eskil={false}`, `offset={0.5}`, `darkness` starting at **0.9**. The user wants the edges to fade into shadow like Diablo 1, so tune until the edges are near black while the center stays readable.
- Constants only. Do not animate them.

**Lower tier:** `TiltShift2` plus the same Vignette. Used on phones that drop frame rate. Switching is one-way (G7).

**Tier selection:** `useDetectGPU` sets the start tier. `PerformanceMonitor` `onDecline` drops to low. Never back up.

### 3.3 Palette (cold stone, warm torch)

- **Stone and floor color maps:** desaturated, cold grays with blue and faint purple undertones. Set in the textures (Phase 1) and in the material color if needed.
- **Ambient and fill lights:** cool blue-violet, low intensity, so the scene is dark by default.
- **Torch:** keep the existing torch color and intensity from Phase 0. It is the only warm light, so it creates the contrast.
- **Contrast:** keep the existing fill low so shadows stay deep. Do not add lights to brighten the scene.
- The composer bypasses renderer tone mapping. If colors look washed out compared to Phase 0, add a `ToneMapping` effect last in the chain instead of changing the renderer.

### 3.4 Acceptance gate

- [x] Camera layout matches Phase 0 numbers.
- [x] Screen edges are near black. The hero and nearby tiles stay sharp. Far areas blur.
- [x] Stone reads cold. The torch is the only warm color on screen.
- [x] No per-frame React renders in the effects component.
- [x] Forcing the low tier swaps effects once, without flicker.

---

## 4. Phase 3: Walls and Floor, Instanced

**Goal:** the whole static dungeon in about two draw calls, with irregular stone walls and slightly uneven tiles.

### 4.1 Structure

```
src/game/instancing/
  seededRandom.ts        // hash(gx, gz, seed) -> PRNG
  buildTileMatrices.ts   // PURE: grid -> floor and wall matrices
  mergeWallColliders.ts  // PURE: grid -> merged rectangles
src/components/environment/
  useEnvironmentAssets.ts  // materials, textures, merged geometry (once)
  InstancedFloor.tsx
  InstancedWalls.tsx
  DungeonColliders.tsx
```

The two PURE modules take plain data and return plain data, so Vitest can test them without WebGL.

### 4.2 Shared source of truth

The grid array drives rendering and collision, built in the same memoized step, keyed by seed and level id.

### 4.3 Materials

- One `MeshStandardMaterial` for floor and one for walls, created once.
- Color map as sRGB. Normal and roughness maps as linear. OpenGL normal maps.
- Repeat wrapping, anisotropy capped at 4 on mobile, `metalness` 0.
- Optional per-instance brightness jitter of about +/-5 % with `setColorAt`, so repeated tiles don't look copied.

### 4.4 Floor

- One `<instancedMesh>` sized to the exact floor cell count.
- Built in `useLayoutEffect`, once per dungeon. For each cell:
  - center position on the grid;
  - Y offset in [-0.05, +0.05] from the seeded PRNG;
  - Z tilt in about [-0.02, +0.02] radians, Euler order `'YXZ'`, so tiles tilt rather than spin;
  - optional 90-degree yaw from the seed, to vary the texture direction.
- Set `instanceMatrix.needsUpdate = true`. Use `StaticDrawUsage`. Set `frustumCulled={false}`.
- Never call `setMatrixAt` in `useFrame`.
- Collider: one flat `CuboidCollider` at the nominal floor plane covering the dungeon. Visual tilt is ignored (G9).

### 4.5 Walls

- One `<instancedMesh>` built from the chipped stone block `.glb`.
- If the `.glb` has several meshes, bake each transform into its geometry and merge into one geometry with `mergeGeometries`. Assert the result is not null.
- Per-instance (seeded): grid position, Y rotation in 90-degree steps, scale variance about +/-3 %, lean at most +/-0.01 radians.
- Apply the shared wall material. Assert `uv` exists in dev.

### 4.6 Colliders

- **Do not** create one RigidBody per cell, and do not use `InstancedRigidBodies`. Those defeat the instancing.
- Walls: greedy-merge the grid into rectangles (`mergeWallColliders.ts`). Render one `<RigidBody type="fixed" colliders={false}>` containing one `<CuboidCollider>` per rectangle.

### 4.7 Camera-blocking wall hiding (if the feature exists)

Phase 0 reports whether it exists. If it does, port it to instancing:
- Recompute the set of blockers only when the hero's grid cell changes (compare to a stored cell).
- Hide a blocker by writing a shortened matrix for that instance. Update only changed indices, then set `needsUpdate` once.

### 4.8 Lifecycle

- Mount both instanced meshes with `key={levelId}` so a new dungeon remounts them.
- On unmount, dispose only materials and textures created here, never cached GLTF geometry.

### 4.9 Acceptance gate

- [x] Environment draw calls: floor 1, walls 1, both lower than baseline.
- [x] Walls show irregular, chipped edges. Floor tiles look slightly uneven.
- [x] Same seed gives the same dungeon after reload and HMR.
- [ ] Hero walks the full map with no snagging and no passing through walls.
- [ ] Descending levels: no warnings, no memory growth over 10 descents.
- [x] Vitest passes for `buildTileMatrices` (deterministic, correct counts, Y within +/-0.05) and `mergeWallColliders` (every wall cell covered exactly once).

---

## 5. Phase 4: Hero (knight kitbash, animation, torch)

**Goal:** a detailed knight with the spec in section 0.3, animated, collidable, with the existing torch light moving in his left hand.

### 5.1 Structure

```
src/components/hero/
  Hero.tsx            // RigidBody + CapsuleCollider; keeps existing KCC and ECS wiring
  HeroModel.tsx       // loads base model, animations, facing
  HeroAttachments.tsx // shield, pauldron, hood, sword, boots attached to bones
  HeroTorch.tsx       // torch light attached to the left-hand bone
src/game/hero/
  heroConfig.ts              // capsule size, speed thresholds, bone names, offsets
  useHeroAnimationState.ts   // velocity -> Idle/Run crossfade
```

### 5.2 Physics

- Keep the existing body type and `KinematicCharacterController`. **Do not change to `dynamic`.**
- `<RigidBody colliders={false} enabledRotations={[false, false, false]}>` (explicit, even though kinematic bodies do not rotate).
- `<CapsuleCollider args={[halfHeight, radius]} />`, sized from the measured bounding box (measure in dev once, then write the numbers into `heroConfig.ts`).
- The body origin is the capsule center. The model's origin is at the feet, so offset the model group down by `halfHeight + radius`.
- Rotate only the model group to face the direction of movement, with shortest-path damping on Y. Never rotate the body.
- The ECS entity keeps receiving its position from the body in `useFrame`, as now.

### 5.3 Base model

- Load with `useGLTF` and `useGLTF.preload`. Wrap in `<Suspense>` with the existing hero as the fallback so the game never blanks.
- `frustumCulled={false}` on skinned meshes. `castShadow` and `receiveShadow` off (G5).
- Scale is baked to 1 in Phase 1. Set `HERO_HEIGHT` in config if a correction is needed.

### 5.4 Attachments (kitbash)

- Find each bone once after the model mounts, using `scene.getObjectByName(name)`. In dev, traverse the skeleton and log every bone name (Mixamo strips the colon, e.g. `mixamorigRightHand`). Pick the right-hand bone for the sword, the left-hand bone for the torch, the left-shoulder bone for the pauldron, the spine or shoulder bone for the shield on the back, and the head bone for the hood.
- Attach each piece as a child of its bone, using `createPortal` or `bone.add`. Use fixed local offsets and rotations set in `heroConfig.ts`. Tune by eye.
- If a bone name is missing, log the available names and skip that piece. Never crash.
- **Materials:** the hood gets the red cloth color. Plate pieces get a metal material (metalness high, roughness mid, cool gray tint to match the palette). Leather gets a dark brown, low-gloss material.
- Keep the total triangle count of the hero under about 25k.

### 5.5 Animation

- `useAnimations(animations, groupRef)`. In dev, assert `Idle` and `Run` exist.
- State is derived from the entity's velocity inside `useFrame`, but **act only on change**, stored in a ref. Never `setState`.
- Hysteresis: enter Run above about 0.5 units/s, return to Idle below about 0.2 units/s.
- Crossfade: `next.reset().fadeIn(0.2).play()` and `prev.fadeOut(0.2)`.
- Scale Run `timeScale` by speed over authored speed, clamped to [0.6, 1.6].
- Identical under autoplay and manual override, since it reads only velocity.

### 5.6 Torch

- The torch light uses the **exact** color, intensity, distance, and decay recorded in Phase 0. Do not change them.
- Attach it to the left-hand bone, so it swings with the animation. Verify the bone-space scale in dev. Tune the local offset to place the flame above the handle.
- Add a subtle flicker: a small intensity variation from two sine waves, written to the light ref in `useFrame`. No allocation, no state.
- Optional: a small emissive flame mesh at the torch head. Keep it simple.
- This stays the only dynamic light (G4).

### 5.7 Acceptance gate

- [x] Knight visible, feet on the floor, no floating or sinking.
- [x] Hood, back shield, left pauldron, sword in right hand, torch in left hand, all visible and attached to the right bones.
- [x] Idle at rest, Run when moving, smooth crossfades, under both autoplay and manual control.
- [x] Torch light matches the Phase 0 brightness and moves with the left hand.
- [ ] Hero does not snag on tiles or pass through walls.
- [x] No re-renders of hero components during play. No new console warnings.
- [x] Monsters, combat, and the rest of the game work as before (G12).

---

## 6. Phase 5: Blob Shadows, Performance, Final Config

**Goal:** grounded look with no shadow maps, a locked 60 fps budget, and a degradation plan.

### 6.1 Shadows

- Grep for `castShadow|receiveShadow|shadows|shadow-|shadowMap`. Remove every hit, including any old torch shadow settings. Do not set `gl.shadowMap.enabled`.
- Re-run the grep at the end. Zero hits.

### 6.2 Blob shadows

- One shared radial gradient `CanvasTexture` (about 128 px, dark center fading to transparent), created once.
- `PlaneGeometry(1, 1)`, flat, scaled to the character footprint.
- `MeshBasicMaterial` with the gradient map, `transparent`, `depthWrite={false}`, `toneMapped={false}`, opacity about 0.6, slightly above the floor in `renderOrder`. Add `polygonOffset` if z-fighting shows. Non-interactive (`raycast={() => null}`).
- **Height:** place the blob at the floor's nominal height plus the maximum tile offset (0.05) plus 0.01, so it never hides under a raised tile. Store `FLOOR_MAX_JITTER = 0.05` in config and derive from it.
- Follow only X and Z each frame.
- Monsters: once there are more than about 6, use one `InstancedMesh` for all blobs, updating instance matrices for living entities.

### 6.3 Canvas and physics (final)

- `<Canvas dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}>`. No `shadows` prop.
- `<PerformanceMonitor>` feeding the one-way tier store (Phase 2).
- `<Physics timeStep={1/60} interpolate colliders={false}>`. Never `timeStep="vary"`.
- Dev-only `<Stats />` and a throttled `renderer.info` log, gated by `import.meta.env.DEV`.

### 6.4 Budgets (record real measurements in `docs/PERF_CHECKLIST.md`)

| Metric | Target |
|--------|--------|
| Frame time, mid-range phone | 16.6 ms or less, steady |
| Draw calls | about 15 or fewer |
| Triangles visible | about 150k or fewer |
| Textures | 8 or fewer, none above 1024 px |
| Dynamic lights | exactly 1 (torch) |
| Post passes | one DoF (high) or TiltShift2 (low), plus Vignette |
| Soak | 5 minutes autoplay, no memory growth |

Test on a real phone with `vite --host` on the local network and remote debugging.

### 6.5 Degradation ladder (apply in order, only if the budget is missed)

1. Lower DoF `resolutionScale` (0.5 down to 0.35).
2. Switch to the low tier (TiltShift2).
3. Drop grain or dither.
4. Cap dpr at 1.25.
5. Reduce torch flicker amplitude. Do not change the torch's brightness.
6. Drop the wall normal map.
7. Last resort: stop rendering far rows.

### 6.6 Deploy

- Use Vite URL imports so assets get hashed filenames. Do not depend on unhashed large files in `public/`.
- Record JS and asset sizes from `npm run build` in `AI_HANDOFF.md`.

### 6.7 Acceptance gate

- [x] Shadow grep: zero hits.
- [ ] Blob visible under the hero on every tile, no z-fighting.
- [x] dpr clamped at 1.5 on a high-density phone.
- [x] Physics on a fixed 1/60 step, no jitter at 60 or 120 Hz.
- [ ] `PERF_CHECKLIST.md` filled with measured numbers.

---

## 7. Definition of Done

- All phase gates pass. `docs/ASSETS.md` lists every asset source and license. `docs/PERF_CHECKLIST.md` has phone numbers.
- Autoplay, manual override, monsters, and combat regress nothing (G12). The torch brightness matches Phase 0.
- `tsc`, lint, and build are clean. Vitest passes.
- `AI_HANDOFF.md` is updated. No dev routes or debug logs left outside `import.meta.env.DEV`.

---

## 8. Micro-step index

| Step | Phase | Task |
|------|-------|------|
| 0.1 | 0 | Recon and baseline (record torch and camera values) |
| 1.1 | 1 | `docs/ASSET_PIPELINE.md` and `docs/ASSETS.md`; wait for user assets |
| 1.2 | 1 | `scripts/optimize-assets.mjs` |
| 1.3 | 1 | `src/config/assets.ts` |
| 1.4 | 1 | Temporary verify route for clip and bone names (then delete) |
| 2.1 | 2 | `dioramaConfig.ts` and tier store |
| 2.2 | 2 | Canvas flags |
| 2.3 | 2 | Effects: DoF with autofocus ref, Vignette (high tier) |
| 2.4 | 2 | Effects: low tier, PerformanceMonitor downgrade |
| 2.5 | 2 | Palette: ambient and fill light colors, color map check |
| 3.1 | 3 | Pure modules: seeded random, tile matrices, wall merge (+ Vitest) |
| 3.2 | 3 | `useEnvironmentAssets.ts` |
| 3.3 | 3 | `InstancedFloor.tsx` |
| 3.4 | 3 | `InstancedWalls.tsx` |
| 3.5 | 3 | `DungeonColliders.tsx`; remove old per-block bodies |
| 3.6 | 3 | Wall hiding port (if it exists) |
| 4.1 | 4 | `heroConfig.ts` and measured capsule |
| 4.2 | 4 | `HeroModel.tsx` (base model, facing, no animation) |
| 4.3 | 4 | `Hero.tsx` physics (keep KCC and ECS) |
| 4.4 | 4 | `useHeroAnimationState.ts` (Idle/Run) |
| 4.5 | 4 | `HeroAttachments.tsx` (hood, shield, pauldron, sword, boots) |
| 4.6 | 4 | `HeroTorch.tsx` (existing torch values, flicker, left-hand bone) |
| 5.1 | 5 | Remove all shadow usage; grep gate |
| 5.2 | 5 | `BlobShadow.tsx` (hero) and instanced blobs (monsters) |
| 5.3 | 5 | Final Canvas and Physics config, dev overlay |
| 5.4 | 5 | Phone measurements, `PERF_CHECKLIST.md`, degradation ladder if needed |
