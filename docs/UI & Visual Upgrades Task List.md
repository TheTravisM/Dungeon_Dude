# UI & Visual Upgrades Task List (Prioritized)

## 1. Physically Based Rendering (PBR) & Normal Mapping
- **Impact:** Highest (Transforms flat colored blocks into detailed, tactile stone, wood, and brick with zero extra geometry).
- **Libraries/Assets:** Utilize `@react-three/drei`'s built-in hooks and pull free 2K PBR texture sets from Poly Haven (e.g., "Castle Brick Floor" or "Worn Stone Wall").
- **Task Details:**
  - Import `useTexture` from `@react-three/drei`.
  - Replace basic `meshStandardMaterial` color properties with texture maps: `map` (Albedo), `displacementMap`, `normalMap`, `roughnessMap`, and `aoMap`.
  - Adjust `roughness` and `metalness` scales per material type (e.g., stone roughness `0.8`, metal trim roughness `0.2`).
- **Performance Guardrail:** Wrap textures in KTX2 compression or use smaller 1K/2K resolution variants. Enable `generateMipmaps` to prevent texture shimmering at a distance.

## 2. Screen Space Ambient Occlusion (SSAO) & Advanced Post-Processing
- **Impact:** Very High (Instantly grounds blocky geometry by adding realistic soft shadows to corners, crevices, and intersecting grid blocks).
- **Libraries/Assets:** `@react-three/postprocessing` (already in your stack).
- **Task Details:**
  - In your post-processing pipeline component, add the `<SSAO>` pass inside the `<EffectComposer>`.
  - Tune parameters (`intensity: 1.5`, `radius: 0.4`, `bias: 0.02`) to emphasize the diorama scale without creating heavy black halos around edges.
  - Combine with existing TiltShift, Dither, Noise, and Vignette effects to complete the tactile tabletop look.
- **Performance Guardrail:** Limit SSAO sample count to medium/low in fragment shaders if frame rates dip on lower-end hardware; your RTX 3090 will handle ultra settings effortlessly, but ensure graceful degradation.

## 3. GPU Instancing for Dungeon Environment Tiles
- **Impact:** High (Crucial for maintaining 60+ FPS when scaling up procedural dungeon complexity with heavy PBR textures).
- **Libraries/Assets:** `@react-three/drei` (`<Instances>` and `<Instance>`).
- **Task Details:**
  - Refactor the procedural dungeon generator to use instanced meshes for repeating floor tiles, wall segments, and pillar structures.
  - Instead of mounting hundreds of individual `<mesh>` nodes into the React reconciler, batch them into single draw calls using Drei's instancing components.
- **Performance Guardrail:** Drastically reduces CPU draw-call overhead, freeing up main-thread cycles for Rapier physics and Miniplex ECS updates.

## 4. Dynamic Point Lights & Soft Shadow Maps
- **Impact:** Medium-High (Replaces flat ambient lighting with dramatic, localized contrast from torches and magical elements).
- **Libraries/Assets:** Three.js core / Drei helpers.
- **Task Details:**
  - Ensure the Canvas configuration enables `shadows` with `PCFSoftShadowMap`.
  - Attach a flickering point light to the hero's torch object with `castShadow` enabled and optimized shadow map resolutions (`shadow-mapSize={[1024, 1024]}`).
  - Set up tile-based baking or limit shadow-casting lights to dynamic entities (hero and active monsters) to avoid GPU fill-rate bottlenecks.
- **Performance Guardrail:** Restrict real-time shadow casting to key dynamic lights; keep static dungeon walls set to `receiveShadow` without casting dynamic shadows.

## 5. UI Enhancements: Container Queries & View Transitions API
- **Impact:** Medium (Polishes the HUD and menu screens to match modern web standards without heavy JavaScript animation runtimes).
- **Libraries/Assets:** Native browser APIs and SCSS Modules (`.module.scss`).
- **Task Details:**
  - Build HUD components using CSS Container Queries (`@container`) so health bars, gold counters, and inventory slots scale perfectly regardless of viewport size.
  - Implement native `document.startViewTransition()` for smooth structural state changes between the Main Menu, Playing HUD, and Game Over overlays.
  - Use native HTML popover attributes and `@starting-style` for zero-JS entry animations on dialogue boxes and inventory popups.
- **Performance Guardrail:** Zero runtime memory footprint by relying entirely on native browser layout engines and CSS transitions.

## 6. Procedural Particle Effects & Dust Motes
- **Impact:** Moderate-Low (Adds organic life and atmosphere to the static dungeon rooms).
- **Libraries/Assets:** `@react-three/drei` (`<Sparkles>` or `<Points>`).
- **Task Details:**
  - Drop a lightweight `<Sparkles>` component inside the dungeon bounds to simulate floating dust motes caught in the hero's torchlight.
- **Performance Guardrail:** Keep particle counts bounded (under 300 instances) with additive blending so they incur negligible fragment shader overhead.