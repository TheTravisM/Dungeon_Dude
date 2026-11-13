# Asset Registry

Every shipped asset and its license. Keep this in sync with `src/config/assets.ts`.

## Environment textures

| Asset | File | Source | Author | License |
|-------|------|--------|--------|---------|
| Stone color map | `src/assets/textures/floor_bricks_02_diff_2k.webp` | ambientCG, `Bricks02` material | ambientCG | CC0 |
| Stone normal map (OpenGL) | `src/assets/textures/floor_bricks_02_nor_gl_2k.webp` | ambientCG, `Bricks02` material | ambientCG | CC0 |
| Stone roughness map | `src/assets/textures/floor_bricks_02_rough_2k.webp` | ambientCG, `Bricks02` material | ambientCG | CC0 |
| Stone ambient occlusion map | `src/assets/textures/floor_bricks_02_ao_2k.webp` | ambientCG, `Bricks02` material | ambientCG | CC0 |

The source 2K JPGs remain in `public/assets/textures/` for reference. The optimized WebP files are the shipped assets. The same maps drive the floor and the walls with different material tints and world-space UV scales.

## Environment geometry

| Asset | Source | License | Notes |
|-------|--------|---------|-------|
| Wall block | Built in code | Project code | Beveled box plus deterministic vertex chip displacement, because no library `.glb` was supplied. Replace with a CC0 chipped stone block when one is available. |
| Floor tile | Built in code | Project code | Beveled box (`RoundedBoxGeometry`) per the blueprint fallback. |
| Plinth and trim | Built in code | Project code | Existing Step 4 geometry. |

## Hero

| Asset | Source | License | Notes |
|-------|--------|---------|-------|
| Knight body, armor, hood, shield, pauldron, sword, torch, boots | Built in code | Project code | The Mixamo Paladin files are not present in `assets-src/`, so the existing procedural kit was extended to match the hero brief. Replace with the Mixamo base plus attachments when the FBX files are supplied. |
| Torch light and flame | Existing project code | Project code | Color, intensity, distance, and decay are preserved from the Phase 0 baseline. |

## Audio and other assets

Audio assets are out of scope for this overhaul. Step 8 remains deferred.
