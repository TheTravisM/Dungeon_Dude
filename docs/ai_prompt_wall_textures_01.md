# Context
Act as an Expert React Game Engineer and Three.js / React Three Fiber (R3F) Developer. 
I am working on a React-based 3D dungeon crawler game called "Dungeon_Dude" (you can assume standard R3F setup with `@react-three/fiber` and `@react-three/drei`).

# Task
I need to upgrade the materials for my dungeon walls. I want them to look realistic with natural light bouncing off the stone, but they must remain highly performant (no gameplay slowdowns or long loading times) and fit the game's current style. 

The color palette for the stone walls should consist of gray, purple, and blue tones.

# Technical Requirements & Constraints
1. **Material Type:** Use `<meshStandardMaterial>` to achieve Physically Based Rendering (PBR) so light bounces naturally.
2. **Performance First (No Displacement):** Do NOT use `displacementMap`. Displacement requires geometry subdivisions which will kill performance in a dungeon full of walls. 
3. **Use Normal & Roughness Maps:** Rely heavily on `normalMap` (to simulate deep cracks and rugged stone without extra polygons) and `roughnessMap` (to make the stone look properly matte while edges might catch the light).
4. **Coloring:** Apply the gray, purple, and blue tones. You can achieve this by tinting the `color` property of the material over a greyscale base texture, or by providing code for a procedural shader/canvas texture generation if external assets aren't assumed.
5. **Asset Loading (if using textures):** Write the code assuming we will load lightweight, optimized textures. Show me how to properly load these using `useTexture` from `@react-three/drei` and how to reuse the same material instance across multiple wall meshes to keep draw calls low.

# Output Requested
Please provide:
1. The React component code (e.g., `Wall.jsx` or similar) demonstrating how to implement this highly performant PBR material.
2. A brief explanation of how to structure the textures (e.g., repeating/wrapping the textures using `texture.repeat.set`).
3. Best practices for optimizing the textures for web (e.g., recommended file formats like WebP or KTX2).