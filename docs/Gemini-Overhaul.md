## Dungeon_Dude Overhaul: Technical Blueprint for DeepSeek4.1 Flash

This document serves as the exact step-by-step execution plan to hand off to your AI coding assistant. It outlines the architectural shifts required to transition the game into a high-performance, tilt-shift tabletop diorama using React Three Fiber, Rapier, and Miniplex ECS, strictly optimized for mobile browsers.

---

### Phase 1: Asset Pipeline & Sourcing (Manual & AI Tasks)

Before generating code, the raw assets must be acquired and formatted. Instruct DeepSeek to generate the scaffolding for these assets.

* **Character Sourcing (Mixamo):**
* Navigate to Mixamo and download "Paladin W/Prop J Nordstrom".
* Download the model in `.fbx` format in a T-pose.
* Download the "Idle" and "Run" (or "Walk") animations *without skin* (just the skeleton data).
* **AI Task:** Instruct DeepSeek to write a shell script utilizing `gltf-pipeline` or provide instructions to use Blender to convert the FBX files into a single optimized `.glb` file with embedded animations.


* **Environment Geometry & Textures:**
* Source a single low-poly "Chipped Stone Block" `.glb` and a single "Stone Tile" `.glb` (or rely on Drei's `RoundedBox` as a fallback).
* Source 2K resolution CC0 PBR textures (Color, Normal, Roughness) from Poly Haven or ambientCG for both the walls and the floors.
* Compress all textures to `.webp` format for mobile payload reduction.



### Phase 2: Post-Processing & Camera (The Tilt-Shift Diorama)

This step establishes the visual core of the game. It must run immediately after the base scene is rendering.

* **AI Task:** Instruct DeepSeek to implement `@react-three/postprocessing`.
* **Component Structure:**
* Add an `<EffectComposer>` to the main Canvas.
* Add a `DepthOfField` effect. Set `focusDistance` to perfectly track the player's Y-axis depth, `focalLength` to a narrow band, and `bokehScale` high to simulate a macro camera lens looking at miniatures.
* Add a `Vignette` effect. Set `eskil` to `false`, `offset` to `0.5`, and `darkness` to `0.9` to forcefully crush the edges of the screen into pure black, replicating the *Diablo 1* light radius without calculating expensive WebGL lighting drop-offs.


* **Camera:** Maintain a strict isometric/dimetric orthographic camera (or high-FOV perspective camera) locked to the player's position using `useFrame`.

### Phase 3: High-Performance Instanced Geometry

To prevent mobile GPUs from choking on hundreds of separate wall blocks and floor tiles, the environment must be refactored into InstancedMeshes.

* **AI Task:** Instruct DeepSeek to refactor the ECS environment rendering to use `InstancedMesh`.
* **Floor Implementation:**
* Create a single `<instancedMesh>` for the floor tiles.
* In a `useLayoutEffect`, calculate a grid matrix. Apply a mathematically seeded random Y-axis offset (e.g., +/- 0.05 units) and a slight Z-axis rotation to every single tile instance before setting the matrix. This breaks up the flat plane and catches light irregularly, mimicking physical dungeon tiles.


* **Wall Implementation:**
* Create a separate `<instancedMesh>` for the walls using the chipped stone `.glb` or a slightly deformed geometry.
* Apply the PBR Normal and Roughness maps to the material within the instanced mesh.



### Phase 4: Character Controller & Rapier Physics

The Mixamo Paladin replaces the primitive block mesh, requiring precise bounding volumes for collision and bone-traversal for dynamic lighting.

* **AI Task:** Refactor the Player component.
* **Model & Animation:**
* Load the Paladin `.glb` using Drei's `useGLTF`.
* Extract and blend the Idle and Run animations using Drei's `useAnimations`. Bind the animation states to the keyboard/joystick input vectors.


* **Rapier Integration:**
* Wrap the model in a `<RigidBody colliders="{false}" enabledRotations="{[false," false, false]} type="dynamic">`.
* Manually add a `<CapsuleCollider args="{[halfHeight," radius]}>` that tightly fits the Paladin. This prevents the mesh from snagging on the slightly uneven floor tiles.


* **The Torch Light:**
* Utilize `Object3D.getObjectByName()` within the GLTF scene graph to locate the specific hand or torch bone in the Paladin's rig.
* Attach a Three.js `<PointLight>` (color: warm orange, high intensity, rapid quadratic falloff) directly to this bone so the light source physically swings with the run animation.



### Phase 5: Blob Shadows & Mobile Optimization

To hit a stable 60fps on mobile devices, true shadow maps must be bypassed.

* **AI Task:** Implement performant fake shadows and optimize the render loop.
* **Blob Shadows:**
* Disable `castShadow` and `receiveShadow` on all lights and meshes.
* Underneath the Paladin (and any enemies), attach a simple plane geometry hovering 0.01 units above the floor.
* Apply a radial gradient texture (transparent to black) to this plane, with `transparent={true}` and `depthWrite={false}`. This creates a perfect, cheap ambient occlusion shadow that moves with the character.


* **Optimization Directives for AI:**
* Hardcode `dpr={[1, 1.5]}` on the Canvas to prevent ultra-high-resolution mobile screens from rendering excessive pixels.
* Ensure the Rapier `<Physics>` component is configured for fixed time steps to prevent physics jitter on lower-end mobile processors.