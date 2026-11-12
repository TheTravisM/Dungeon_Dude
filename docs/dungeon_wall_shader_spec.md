# Technical Specification: Shaderfrog Custom Wall Shader Integration

## Project Stack Context
- **Framework:** React 19 (React Compiler active)
- **Build Tool:** Vite 5 + TypeScript (Strict Mode)
- **3D Stack:** Three.js, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`)
- **Physics:** `@react-three/rapier` (Fixed 60Hz Timestep)

---

## 1. Objective
Upgrade the visual fidelity of all dungeon wall meshes by implementing a custom Shaderfrog-inspired shader material (`DungeonWallMaterial`). The material must feature **World-Space Triplanar Mapping** so that wall textures/procedural noise map seamlessly without UV stretching regardless of wall scale or orientation, while preserving existing Rapier physics colliders (`<RigidBody type="fixed">`).

---

## 2. Architecture & File Structure

Create or update the following files:

```
src/
├── components/
│   └── environment/
│       ├── DungeonWall.tsx       # Wall mesh & Rapier physics wrapper
│       └── WallShaderMaterial.ts # Shaderfrog material definition & R3F extension
```

---

## 3. Shaderfrog & Shader Implementation

### 3.1 Shader Material Definition (`WallShaderMaterial.ts`)

Use `@react-three/drei`'s `shaderMaterial` helper to construct the custom material, passing uniform state and GLSL strings. 

#### Uniforms Required
- `uTime` (`number`): Frame animation time elapsed.
- `uBaseColor` (`THREE.Color`): Primary stone color.
- `uMortarColor` (`THREE.Color`): Deep groove/mortar color.
- `uNoiseScale` (`number`): Procedural stone pattern frequency.
- `uRoughness` (`number`): Roughness value for lighting calculations.
- `uTileScale` (`number`): Triplanar mapping texture scale.

#### GLSL Vertex Shader Specifications
- Must calculate `vWorldPosition` and `vNormal` in world space to enable triplanar mapping across tiled walls.

```glsl
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
```

#### GLSL Fragment Shader Specifications (Shaderfrog Triplanar Stone Pattern)
- Implement 3D simplex or perlin noise for procedural stone cracking/texture.
- Use blend weights based on absolute world normals:
  $$\text{weights} = \frac{|\text{vNormal}|^p}{\sum |\text{vNormal}|^p} \quad (p \approx 4.0)$$
- Sample noise/patterns along X, Y, and Z axes and blend via triplanar weights to eliminate UV stretching on wall blocks.

```glsl
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uMortarColor;
uniform float uNoiseScale;
uniform float uTileScale;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

// Procedural 3D Noise for Shaderfrog Effect
float hash(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
  );
}

void main() {
  // Triplanar Blend Weights
  vec3 blendWeights = pow(abs(vNormal), vec3(4.0));
  blendWeights /= (blendWeights.x + blendWeights.y + blendWeights.z);

  // Sample World Space Coordinates
  vec3 coord = vWorldPosition * uTileScale;
  
  float nX = noise3D(vec3(coord.yz, 0.0) * uNoiseScale);
  float nY = noise3D(vec3(coord.xz, 0.0) * uNoiseScale);
  float nZ = noise3D(vec3(coord.xy, 0.0) * uNoiseScale);
  
  float finalNoise = nX * blendWeights.x + nY * blendWeights.y + nZ * blendWeights.z;

  // Edge and Stone Cracks Simulation
  float stonePattern = smoothstep(0.35, 0.65, finalNoise);
  vec3 finalColor = mix(uMortarColor, uBaseColor, stonePattern);

  // Basic Directional Ambient / Diffuse Shading
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.7));
  float diff = max(dot(vNormal, lightDir), 0.2);

  gl_FragColor = vec4(finalColor * diff, 1.0);
}
```

---

## 4. TypeScript & React 19 Declarations

Extend JSX Intrinsic Elements so TypeScript recognizes `<dungeonWallMaterial />`:

```typescript
import { shaderMaterial } from '@react-three/drei';
import { extend, ThreeElement } from '@react-three/fiber';
import * as THREE from 'three';

export const DungeonWallMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color('#3a3f47'),
    uMortarColor: new THREE.Color('#1a1c20'),
    uNoiseScale: 2.5,
    uTileScale: 0.5,
  },
  vertexShaderSource,
  fragmentShaderSource
);

extend({ DungeonWallMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    dungeonWallMaterial: ThreeElement<typeof DungeonWallMaterial>;
  }
}
```

---

## 5. R3F & Physics Integration (`DungeonWall.tsx`)

1. **Keep Rapier Colliders Untouched:** Ensure `<RigidBody type="fixed">` wraps the mesh to keep collision physics independent of the visual material.
2. **Animation Loop:** Update `uTime` uniform inside `useFrame` if dynamic/ambient effects are enabled.

```tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import './WallShaderMaterial';

interface DungeonWallProps {
  position: [number, number, number];
  size: [number, number, number];
}

export const DungeonWall: React.FC<DungeonWallProps> = ({ position, size }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <mesh receiveShadow castShadow>
        <boxGeometry args={size} />
        <dungeonWallMaterial
          ref={materialRef}
          uBaseColor={new THREE.Color('#2d3238')}
          uMortarColor={new THREE.Color('#0f1114')}
          uNoiseScale={3.0}
          uTileScale={0.4}
        />
      </mesh>
    </RigidBody>
  );
};
```

---

## 6. Implementation Checklist for AI Agent
- [ ] Create `WallShaderMaterial.ts` with vertex/fragment shaders and TS type extensions.
- [ ] Implement Triplanar projection to ensure textures/noise look continuous across walls of different dimensions.
- [ ] Replace existing wall meshes/materials with `<dungeonWallMaterial />`.
- [ ] Verify that Rapier physics rigidbodies (`<RigidBody type="fixed">`) remain unchanged and functional.
- [ ] Test build via `vite build` to ensure React 19 compiler compatibility without GLSL uniform reference errors.