# Performance Checklist

Target platform: mobile browsers, 60 fps on a mid-range phone. Record real device numbers, not guesses. The dev overlay (`RendererInfoLogger`) prints draw calls, triangles, textures, geometries, and an FPS estimate every two seconds in development builds.

## Budgets

| Metric | Target | Desktop build | Phone |
|--------|--------|---------------|-------|
| Frame time | 16.6 ms or less, steady | Pending browser run | Pending |
| Draw calls | about 15 or fewer | Pending browser run | Pending |
| Triangles visible | about 150k or fewer | Pending browser run | Pending |
| Textures | 8 or fewer, none above 1024 px | 4 shipped textures, max 512 px | Pending |
| Dynamic lights | exactly 1 (torch) | 1 spotlight + 1 point fill on the same torch group | Pending |
| Post passes | DoF (high) or TiltShift2 (low), plus Vignette | Implemented | Pending |
| Soak | 5 minutes autoplay, no memory growth | Pending | Pending |

## Shipped asset sizes

From `npm run build` on 2026-11-13:

- JS bundle: 3,705.18 kB (1,244.22 kB gzip), including the Rapier WASM.
- Textures: 9.91 kB AO, 16.16 kB normal, 34.14 kB roughness, 51.69 kB color.
- CSS: 9.59 kB (2.62 kB gzip).

## How to measure on a phone

1. Run `npm run dev -- --host` and open the LAN URL on the phone.
2. Enable remote debugging and watch the `[renderer]` console line.
3. Play with autoplay for 5 minutes; record the steady FPS, draw calls, triangles, and texture count.
4. If the budget is missed, apply the degradation ladder in this order:
   1. Lower DoF `resolutionScale` from 0.5 to 0.35.
   2. Force the low tier (TiltShift2).
   3. Drop grain or dither (already absent in the current pipeline).
   4. Cap dpr at 1.25.
   5. Reduce torch flicker amplitude without changing brightness.
   6. Drop the wall normal map.
   7. Stop rendering far rows as a last resort.

## Notes

- Shadow maps are disabled entirely. Grounding comes from the radial blob decal, so there is no shadow pass to budget.
- The floor is one instanced mesh and the walls are one instanced mesh in the current renderer, for two static environment draw calls plus the plinth and trim.
- Physics uses a fixed `1/60` timestep with interpolation; never switch to `timeStep="vary"`.
