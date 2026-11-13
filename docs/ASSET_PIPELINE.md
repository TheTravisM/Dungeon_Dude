# Asset Pipeline Checklist

Library-first sourcing for the visual overhaul. Raw downloads go in `assets-src/`, which is git-ignored. Only optimized files are committed.

## 1. Hero base (Mixamo, Adobe login required)

1. In Mixamo, Characters, download **Paladin W/Prop J Nordstrom** as FBX Binary, T-pose, with skin.
2. Open the preview and note which pieces already exist: hood, shield, pauldron, cape. Report that list before sourcing add-ons.
3. In Animations, download **Idle** and **Run** (Sword And Shield versions when available) as FBX Binary, Without Skin, 30 fps. Enable **In Place** on Run.

Save the files as:

- `assets-src/hero/paladin.fbx`
- `assets-src/hero/idle.fbx`
- `assets-src/hero/run.fbx`

## 2. Hero add-ons (CC0 or permissive)

Source each piece from Poly Haven, Kenney, Quaternius, or a CC0 Sketchfab model. Prefer `.glb`.

4. Large round or kite shield for the back.
5. Plate pauldron for the left shoulder.
6. Hood or cowl that can be recolored red. A cloak or hood mesh is acceptable.
7. Wide sword for the right hand.
8. Torch handle for the left hand (a simple handle is enough; the existing light supplies the flame).
9. Leather body and large brown boots if the Paladin body does not fit the brief.

Save them under `assets-src/hero/attachments/`.

## 3. Environment (CC0)

10. Wall block: one chipped or beveled stone block `.glb`, irregular edges, 300 triangles maximum. Save as `assets-src/env/wall-block.glb`.
11. Floor tile: one stone flagstone `.glb`, 100 triangles maximum, or accept the beveled geometry fallback. Save as `assets-src/env/floor-tile.glb`.
12. Textures from Poly Haven or ambientCG at 2K source: dark rough rock and dark flagstone, each with Color, Normal (OpenGL), and Roughness. Save under `assets-src/textures/`.

Palette requirement: cool, desaturated gray and blue-gray color maps. The torch must remain the only warm color on screen.

## 4. Record licenses

For every file, add a row to `docs/ASSETS.md` with source URL, author, and license. Confirm the current Mixamo and Adobe terms before redistributing any model.

## 5. Optimize

Run:

```powershell
npm run assets:optimize
```

This writes `.webp` textures (1024 px, 512 px for floor if quality holds) to `src/assets/textures/` and optimized models to `public/models/`, then prints a size report. Textures live under `src/` so Vite hashes them for caching. If meshopt breaks a skinned model, keep that model uncompressed.

Targets:

- Each character under about 3 MB.
- Environment models and textures together under about 3 MB.

## 6. Verify

- All files exist and are logged in `docs/ASSETS.md`.
- The temporary dev route shows the base model and logs clip names including Idle and Run.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Gameplay is unchanged.

## Current status

The repository does not yet contain Mixamo files. Until they arrive, the hero remains the existing procedural knight kit (red hood, back shield, left pauldron, sword, torch, leather body, brown boots) and the walls use the existing beveled geometry plus PBR stone maps. This substitution is recorded in `docs/ASSETS.md` and `AI_HANDOFF.md`.
