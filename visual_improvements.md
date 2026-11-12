# Dungeon Dude: Visual Upgrade & UI Roadmap

> Senior UI Architect / R3F + Three.js. This is the single tracking list for the
> "AAA miniature diorama" upgrade. Tasks are strictly ordered from greatest
> positive visual impact to least. Each task lists the exact NPM package or
> asset, an implementation snippet, and a performance guardrail so the RTX 3090
> target of 60+ FPS holds.

## How to read this file
- Status: `[DONE]` verified in the codebase, `[TODO]` not started, `[OPTIONAL]` nice-to-have.
- Impact: High / Medium / Low (visual).
- Every `[TODO]` has a **Performance guardrail**.

## Current state (verified against the codebase)

| Area | Status | Where | Notes |
| --- | --- | --- | --- |
| PBR floor/wall materials | `[DONE]` | `DungeonFloorMaterial.ts`, `DungeonWallPbrMaterial.ts` | `useTexture` + `onBeforeCompile` world-space triplanar UV; mipmaps + anisotropy 4 |
| GPU instancing | `[DONE]` | `DungeonFloor.tsx` (1 mesh), `DungeonWalls.tsx` (2 batches) | `InstancedMesh` with precomputed matrices |
| SSAO + post FX | `[DONE]` | `Effects.tsx` | SSAO(16/3) + TiltShift + Noise + Vignette + custom Dither; MSAA=4; normal pass |
| Torch dynamic light | `[DONE]` | `HeroTorch.tsx`, `useTorchFlicker.ts` | spotlight `castShadow` 1024 + point fill + emissive flame + Sparkles |
| Ambient dust | `[DONE]` | `Dungeon.tsx` | `Sparkles` count 180 |
| View Transitions API | `[DONE]` | `screenTransition.ts`, `global.scss` | `document.startViewTransition` + `flushSync` + reduced-motion |
| Container queries | `[DONE]` | `HUD.module.scss` | `container-type` + `@container` + `cqw` |
| `@starting-style` popover | `[DONE]` | `global.scss` | `[popover]` entry animation |
| Shadow map type | `[TODO]` | `App.tsx` | currently `shadows="percentage"` (PCF); target `PCFSoftShadowMap` |
| IBL / environment map | `[TODO]` | none | PBR materials have no `scene.environment` (indirect specular is black) |
| Bloom | `[TODO]` | `Effects.tsx` | no bloom; flame/emissive read flat |
| Diorama base shadow | `[TODO]` | none | only the torch casts; the diorama floats |
| Texture compression | `[TODO]` | `public/assets/textures` | 2K JPGs (~5 MB total), no KTX2 |

## Ranked tasks (greatest visual impact first)

### 1. `[TODO]` Image-Based Lighting via drei `<Environment>` + `<Lightformer>`
- **Impact:** High.
- **Package:** `@react-three/drei` (installed): `Environment`, `Lightformer`.
- **Why:** Every `meshStandardMaterial` (floor, walls, hero armor, monster
  parts, plinth) computes its indirect specular and IBL ambient from
  `scene.environment`. That is currently unset, so all reflections and the
  ambient term come from only two analytic lights. Metals (sword metalness
  0.88, armor 0.28 to 0.65) and rough stone read flat. Baking one small IBL
  cube map makes the entire PBR pipeline come alive in a single move. This is
  the highest-impact remaining change.

```tsx
// src/components/scene/Lighting.tsx
import { Environment, Lightformer } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      {/* Baked once into a 256px half-float cube map. background (default
          false) keeps the existing <color attach="background"> as the clear
          color, so the diorama backdrop is unchanged. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.6} position={[0, 5, -9]} scale={[12, 1, 1]} color="#c2cbdc" />
        <Lightformer intensity={0.8} position={[-6, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 1, 1]} color="#9aa0b8" />
        <Lightformer intensity={0.5} position={[6, 0.5, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 1, 1]} color="#ffbe82" />
        <Lightformer intensity={0.35} position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#1d222b" />
      </Environment>

      {/* IBL now supplies the ambient term, so lower the flat ambient to avoid
          double-brightening the scene. */}
      <ambientLight color="#9aa0b8" intensity={0.28} />
      <directionalLight color="#c2cbdc" intensity={1.65} position={[12, 18, 8]} />
    </>
  );
}
```

- **Performance guardrail:**
  - `frames={1}` bakes once per mount (the dungeon re-mounts per depth via
    `key={layout.seed}`), so runtime cost is one 256px cube render, negligible.
  - No network: children are baked locally (no `files`/`preset`), so no HDR
    download and the CSP stays closed.
  - Keep `resolution` at 256; 512 is rarely worth it for a stylized diorama.

### 2. `[TODO]` Bloom for torch and emissive glow
- **Impact:** Very High.
- **Package:** `@react-three/postprocessing` (installed): `Bloom`.
- **Why:** The torch flame is a `toneMapped={false}` basic material and the
  monster parts use emissive. Without bloom these read as flat bright pixels.
  Bloom makes the flame, embers, and gold trims glow, which is what sells
  "torchlight in a dark diorama."

```tsx
// src/components/Effects.tsx, inside <EffectComposer>, after <SSAO>
<Bloom
  mipmapBlur
  intensity={0.7}
  luminanceThreshold={0.55}
  luminanceSmoothing={0.2}
  resolutionScale={0.5}
/>
```

- **Performance guardrail:**
  - `mipmapBlur` uses a mipmap chain instead of a full-res blur (cheaper, softer).
  - `resolutionScale={0.5}` halves the bloom buffer.
  - Keep `luminanceThreshold` high (0.5 to 0.7) so only the flame/emissive/gold
    bloom; a low threshold blooms the whole scene and hides diorama detail.
  - One extra full-screen pass; under 1 ms at 0.5 scale on the target GPU.

### 3. `[TODO]` Switch to `PCFSoftShadowMap`
- **Impact:** Medium-High.
- **Package:** none (three core, already in the stack).
- **Why:** The Canvas is set to `shadows="percentage"` (`PCFShadowMap`), which
  gives harder, slightly noisy edges on the torch spotlight. `PCFSoftShadowMap`
  gives the soft "expensive" shadow edge that matches the diorama look. R3F maps
  `shadows="soft"` (or boolean `shadows`) to `PCFSoftShadowMap`.

```tsx
// src/App.tsx
<Canvas
  shadows="soft"
  dpr={[1, 2]}
  orthographic
  camera={{ position: CAMERA_OFFSET, zoom: CAMERA_ZOOM, near: 0.1, far: 200 }}
>
```

- **Performance guardrail:**
  - PCFSoft samples a small kernel per texel; at the current 1024 shadow maps
    this is negligible.
  - Do not raise shadow map size to compensate; 1024 is plenty for a 20x20
    diorama.

### 4. `[TODO]` Ground the diorama (base shadow)
- **Impact:** Medium.
- **Package:** `@react-three/drei` (installed): `ContactShadows`.
- **Why:** Right now the only shadow caster is the torch spotlight. The rest of
  the diorama floats on the clear color. A soft base shadow under the plinth
  sells the "miniature on a table" read.

Option A (recommended, cheapest): a baked `<ContactShadows>` under the plinth.

```tsx
// src/components/dungeon/Dungeon.tsx, inside the <group>, before <DungeonPlinth />
import { ContactShadows } from '@react-three/drei';
import { PLINTH_SIZE, PLINTH_HEIGHT } from '../../game/dungeon/constants';

<ContactShadows
  position={[0, -PLINTH_HEIGHT - 0.01, 0]}
  scale={PLINTH_SIZE * 1.05}
  far={4}
  blur={2.4}
  opacity={0.55}
  resolution={512}
  frames={1}
  color="#000000"
/>
```

Option B (full dynamic grounding): a directional key shadow.

```tsx
// src/components/scene/Lighting.tsx
<directionalLight
  color="#c2cbdc"
  intensity={1.65}
  position={[12, 18, 8]}
  castShadow
  shadow-mapSize={[1024, 1024]}
  shadow-camera-near={1}
  shadow-camera-far={40}
  shadow-camera-left={-14}
  shadow-camera-right={14}
  shadow-camera-top={14}
  shadow-camera-bottom={-14}
  shadow-bias={-0.0004}
  shadow-normalBias={0.04}
/>
```

- **Performance guardrail:**
  - Option A: `frames={1}` bakes once per layout, so runtime cost is zero; it is
    a static texture. `resolution={512}` is plenty for a soft blob. No extra
    per-frame pass.
  - Option B: one extra shadow depth pass over the whole scene. Bound the ortho
    shadow camera to the 20x20 grid (~14 half-extent) so the 1024 map is not
    wasted on empty space. Prefer Option A for a stylized diorama; use Option B
    only if you want the tall walls to cast onto the floor.

### 5. `[TODO]` KTX2 / BasisU texture compression (performance, no visual change)
- **Impact:** None visually. This is a performance prerequisite, so it sits
  outside the visual-impact ranking, but it is required to keep the texture
  budget healthy once IBL + Bloom raise memory bandwidth.
- **Package:** `three-stdlib` (already a transitive dep of drei; add as a
  direct dep) + the `basis` transcoder (ships inside `three`).
- **Why:** The four 2K JPGs total ~5 MB (albedo 2.0 MB, roughness 1.5 MB,
  normal 0.9 MB, AO 0.56 MB). They upload as uncompressed RGBA, which is slow
  and memory-heavy. KTX2 (ETC1S) cuts GPU memory 5 to 10x and speeds upload with
  no visible quality loss at 2K.

Steps:
1. `npm i three-stdlib`
2. Copy the transcoder into the public root:
   - `node_modules/three/examples/jsm/libs/basis/basis_transcoder.js`
   - `node_modules/three/examples/jsm/libs/basis/basis_transcoder.wasm`
   -> `public/basis/`
3. Compress the JPGs to `.ktx2` (ETC1S) with `basisu`:
   ```
   basisu -ktx2 -etc1s -m 0 -q 195 -o public/assets/textures floor_bricks_02_diff_2k.jpg
   ```
   Repeat for `_nor_gl`, `_rough`, `_ao`.
4. Load through `KTX2Loader` with R3F `useLoader` instead of drei `useTexture`
   (drei's `useTexture` uses plain `TextureLoader` and cannot decode KTX2).

```ts
// src/components/environment/useKtx2.ts
import { useLoader, useThree } from '@react-three/fiber';
import { KTX2Loader } from 'three-stdlib';

const BASE = '/assets/textures/floor_bricks_02';

export function useFloorTextures() {
  const gl = useThree((state) => state.gl);
  const [albedoMap, normalMap, roughnessMap, aoMap] = useLoader(
    KTX2Loader,
    [
      `${BASE}_diff_2k.ktx2`,
      `${BASE}_nor_gl_2k.ktx2`,
      `${BASE}_rough_2k.ktx2`,
      `${BASE}_ao_2k.ktx2`,
    ],
    (loader) => {
      loader.detectSupport(gl);
      loader.setTranscoderPath('/basis/');
    }
  );
  return [albedoMap, normalMap, roughnessMap, aoMap] as const;
}
```

Then in `DungeonFloor.tsx` / `DungeonWalls.tsx`, swap `useTexture([...])` for
`useFloorTextures()` and keep the existing `configureDungeonFloorTextures` /
`createDungeonFloorMaterial` calls unchanged (they only set wrap/filter/
colorSpace, which KTX2 textures already carry correctly).

- **Performance guardrail:**
  - ETC1S at 2K is the sweet spot; check the roughness/AO masks for banding and
    bump `-q` to 220 if needed.
  - Keep the original JPGs in git as the offline/dev fallback; reference
    `.ktx2` in production.
  - Do this before shipping the IBL + Bloom frame, since it is the only task
    that reduces cost.

### 6. `[OPTIONAL]` N8AO (higher-quality AO upgrade)
- **Impact:** Medium-Low (incremental; SSAO already works).
- **Package:** `@react-three/postprocessing` (installed): `N8AO` (wraps the
  `n8ao` package, already a dep of `@react-three/postprocessing`).
- **Why:** The current `<SSAO>` is good. `N8AO` handles corners better and
  smears less. It is an upgrade, not a fix, so it ranks below the lighting
  tasks.

```tsx
// src/components/Effects.tsx, replace <SSAO ... /> with:
<N8AO
  aoRadius={1.5}
  aoSamples={12}
  denoiseSamples={4}
  denoiseRadius={8}
  distanceFalloff={1}
  intensity={1.4}
  halfRes
/>
```

- **Performance guardrail:**
  - `halfRes` renders AO at half resolution (biggest cost saver).
  - `aoSamples` 8 to 12 is plenty; do not exceed 16.
  - N8AO is pricier than SSAO at equal settings; if frame time rises, drop
    back to `<SSAO>`.

### 7. `[TODO]` Entity material polish (hero + monsters)
- **Impact:** Low-Medium.
- **Package:** none.
- **Why:** Hero armor and monster bodies use flat `meshStandardMaterial`
  colors. That is correct for stylized low-poly, and with IBL (Task 1) and
  Bloom (Task 2) they already pick up reflections and glow for free. The only
  remaining polish is a couple of cheap tweaks:
  - Give the hero's metal parts a touch more `metalness` / lower `roughness`
    so IBL reflections read (e.g. sword blade `roughness={0.22}`
    `metalness={0.9}`).
  - Add a subtle `emissive` to monster "eye" parts so they catch Bloom.
- **Implementation:** edit the specific `meshStandardMaterial` props in
  `HeroModel.tsx` / `Monster.tsx`. No new packages.
- **Performance guardrail:** zero (material property changes only).

### 8. `[TODO]` Plinth PBR trim
- **Impact:** Low.
- **Package:** none.
- **Why:** `DungeonPlinth.tsx` uses flat `color` materials. With IBL present,
  giving the gold trim a low `roughness` and small `metalness` makes it catch
  a specular highlight, and a subtle `roughness` on the dark plinth body
  keeps it from reading as pure black.
- **Implementation:** in `DungeonPlinth.tsx`, set the trim to
  `roughness={0.35} metalness={0.6}` and the body to `roughness={0.95}`.
- **Performance guardrail:** zero.

### 9. `[OPTIONAL]` Depth of Field
- **Impact:** Low.
- **Package:** `@react-three/postprocessing` (installed): `DepthOfField`.
- **Why:** The scene already has `<TiltShift>` (a DoF-like effect). A true
  `<DepthOfField>` focused on the hero can add a subtle foreground/background
  falloff. This can conflict with TiltShift, so treat it as an A/B experiment.
- **Implementation:** add to `Effects.tsx`:
  ```tsx
  <DepthOfField
    worldFocusDistance={12}
    worldFocusRange={6}
    bokehScale={2}
    resolutionScale={0.5}
  />
  ```
- **Performance guardrail:** one extra pass at 0.5 scale; if it competes with
  TiltShift, keep only one of the two.

### 10. `[OPTIONAL]` Finishing post FX
- **Impact:** Low.
- **Package:** `@react-three/postprocessing` (installed): `Luminance`,
  `HueSaturation`, `ChromaticAberration`.
- **Why:** A very subtle `Luminance`/`HueSaturation` pass can unify the cool
  stone and warm torch tones. A tiny `ChromaticAberration` adds a "lens" feel.
  Both are optional polish.
- **Implementation:** add near the end of the `EffectComposer` chain:
  ```tsx
  <HueSaturation saturation={0.03} />
  <ChromaticAberration offset={[0.0006, 0.0006]} />
  ```
- **Performance guardrail:** each is one cheap full-screen pass; keep offsets
  near zero and re-benchmark, since the composer already runs SSAO + TiltShift
  + Noise + Vignette + (new) Bloom.

### 11. `[TODO]` UI polish (View Transitions + Container Queries already done)
- **Impact:** Low (largely complete).
- **Package:** none (native browser APIs + SCSS Modules).
- **State:** `document.startViewTransition` + `flushSync` is already wired in
  `screenTransition.ts` with a reduced-motion fallback; `HUD.module.scss`
  already uses `container-type: inline-size`, `@container`, and `cqw`; and
  `global.scss` already has `[popover]` + `@starting-style`.
- **Remaining polish:**
  - Add an `@starting-style` fade/scale to the HUD panel and the Game Over
    panel so they enter with the same motion as the popover (zero JS).
  - Give the `glass-panel` mixin a subtle `box-shadow` and a 1px inner
    highlight so the HUD reads as raised glass against the dark stone.
  - Add `:focus-visible` rings to the menu and Game Over buttons (the HUD
    already has one).
- **Implementation:** extend `global.scss` / the `*.module.scss` files only.
- **Performance guardrail:** zero runtime cost; all native CSS.

## Performance budget & verification
- **Target:** 60+ FPS on an RTX 3090 at `dpr={[1, 2]}`.
- **Draw calls (steady state):** floor = 1, walls = 2, plinth = 5, hero = ~30,
  monsters = N x parts. Keep the environment at these numbers; do not add
  per-tile React meshes.
- **Shadow maps:** torch spotlight 1024 (1 map). If you add the directional
  key shadow (Task 4 Option B), that is the only new shadow map; cap it at
  1024 and bound its ortho camera to the grid.
- **Post chain cost (worst case):** SSAO/N8AO + TiltShift + Bloom + Noise +
  Vignette. Keep every effect at `resolutionScale={0.5}` and re-benchmark after
  each addition.
- **Texture memory:** after Task 5 (KTX2/ETC1S 2K) the four maps should sit
  well under 1 MB of GPU memory total, down from ~5 MB of uncompressed upload.
- **How to measure:** use the existing `DungeonStats` / `DebugOverlay`
  (toggle with the stats switch) for draw calls and FPS. For a quick
  auto-degrade guardrail you can wrap the scene in drei's
  `<PerformanceMonitor>` and drop `resolutionScale` to 0.25 or disable Bloom
  when the frame budget is exceeded.
- **A/B switches already present:** `EFFECTS_ENABLED` in `Effects.tsx` and
  `DEBUG_ORBIT_CONTROLS` in `cameraConstants.ts` let you compare the raw
  render against the stylized pipeline and inspect the scene while tuning.

## Suggested order of execution
1. Task 1 (IBL) and Task 2 (Bloom) together: biggest visual jump.
2. Task 3 (PCFSoftShadowMap) and Task 4 (base shadow): grounding.
3. Task 5 (KTX2): lock the performance budget before shipping the new frame.
4. Tasks 6 to 11: incremental polish, benchmark after each.

---

_This file is the single source of truth for the visual/UI upgrade. It supersedes
`docs/UI & Visual Upgrades Task List.md`. Re-verify status against the codebase
as tasks land and move completed items into the table above._