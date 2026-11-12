# Technical Specification: PBR Integrated Weathered Stone Wall Shader

## 1. Architecture & Diagnostic Root Cause

### Root Cause Analysis (`image_980ebe.jpg`)
1. **Broken Torch Lighting:** The previous raw `THREE.ShaderMaterial` bypassed Three.js light uniform loops (`PointLight`, `SpotLight`). Torch lights near the player were completely invisible to the wall GLSL.
2. **Flat "Painted" Look:** Pure procedural Voronoi color without standard PBR surface response (`roughnessMap`, `normalMap` or derivative normals) produces flat 2D color bands that look like painted plastic under isometric camera angles.

### Architectural Solution
Extend Three.js standard PBR materials using `onBeforeCompile` or `MeshStandardMaterial` hooks. This allows us to inject our triplanar stone geometry and surface normal calculations directly into Three.js's native physical lighting engine:
* **Native Light Reaction:** Player torch lights, point lights, directional lights, and ambient lights automatically illuminate the wall.
* **Real Surface Relief:** Fragment normals are perturbed in tangent space before standard PBR lighting (`<lights_fragment_begin>`), causing torchlight to cast realistic specular rim highlights across stone edges.
* **Instancing Support:** Full compatibility with `instancedMesh` matrices (`instanceMatrix`) and shadows (`castShadow`, `receiveShadow`).

---

## 2. Updated Material Implementation (`src/components/environment/WallShaderMaterial.ts`)

```typescript
import * as THREE from 'three';

/**
 * Creates a PBR-compliant MeshStandardMaterial customized with triplanar
 * irregular stone patterns and steep normal perturbation.
 */
export function createDungeonWallMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#14171A'),
    roughness: 0.85,
    metalness: 0.1,
  });

  // Uniforms for stone color variations and bump controls
  const customUniforms = {
    uCharcoalColor: { value: new THREE.Color('#121518') },
    uDarkBlueColor: { value: new THREE.Color('#1A232E') },
    uDarkTealColor: { value: new THREE.Color('#142628') },
    uDarkPurpleColor: { value: new THREE.Color('#201927') },
    uCreviceColor: { value: new THREE.Color('#040507') },
    uTileScale: { value: 0.6 },
    uBumpStrength: { value: 0.65 },
    uNoiseScale: { value: 6.0 },
  };

  material.onBeforeCompile = (shader) => {
    // Merge custom uniforms into standard PBR shader
    Object.assign(shader.uniforms, customUniforms);

    // 1. Inject Varyings into Vertex Shader
    shader.vertexShader = `
      varying vec3 vCustomWorldPosition;
      varying vec3 vCustomNormal;
      ${shader.vertexShader}
    `;

    // 2. Calculate World Position and Normal in Vertex Shader (handling instancing)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      #ifdef USE_INSTANCING
        vec4 customWorldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        mat3 customNormalMat = mat3(modelMatrix * instanceMatrix);
      #else
        vec4 customWorldPos = modelMatrix * vec4(position, 1.0);
        mat3 customNormalMat = mat3(modelMatrix);
      #endif
      vCustomWorldPosition = customWorldPos.xyz;
      vCustomNormal = normalize(customNormalMat * normal);
      `
    );

    // 3. Inject Custom Functions & Varyings into Fragment Shader
    shader.fragmentShader = `
      varying vec3 vCustomWorldPosition;
      varying vec3 vCustomNormal;

      uniform vec3 uCharcoalColor;
      uniform vec3 uDarkBlueColor;
      uniform vec3 uDarkTealColor;
      uniform vec3 uDarkPurpleColor;
      uniform vec3 uCreviceColor;
      uniform float uTileScale;
      uniform float uBumpStrength;
      uniform float uNoiseScale;

      // Hash & 3D Noise Helper
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453123);
      }

      float hash3(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      float noise3D(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
              mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
              mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }

      float fbm(vec3 p) {
        float val = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          val += amp * noise3D(p);
          p *= 2.03;
          amp *= 0.5;
        }
        return val;
      }

      // Domain-Warped Voronoi for irregular stone slab layout
      vec3 voronoi(vec2 x) {
        vec2 n = floor(x);
        vec2 f = fract(x);
        vec2 mg, mr;
        float md = 8.0;
        float md2 = 8.0;

        for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            o = 0.5 + 0.45 * sin(6.2831 * o);
            vec2 r = g + o - f;
            float d = dot(r, r);

            if (d < md) {
              md2 = md;
              md = d;
              mr = r;
              mg = g;
            } else if (d < md2) {
              md2 = d;
            }
          }
        }
        float cellId = hash3(vec3(n + mg, 7.3));
        return vec3(sqrt(md), sqrt(md2), cellId);
      }

      ${shader.fragmentShader}
    `;

    // 4. Override Base Map & Normal Fragment Calculation to hook into Three PBR pipeline
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>

      // Calculate Triplanar Weights
      vec3 blendWeights = pow(abs(vCustomNormal), vec3(6.0));
      blendWeights /= (blendWeights.x + blendWeights.y + blendWeights.z);

      vec3 coord = vCustomWorldPosition * uTileScale;

      // Domain warp for non-rectangular rugged stone shapes
      vec3 warp = vec3(
        fbm(coord),
        fbm(coord + vec3(4.3, 1.2, 2.8)),
        fbm(coord + vec3(1.7, 5.2, 3.1))
      );
      vec3 warpedCoord = coord + warp * 0.4;

      // Projected Voronoi
      vec3 vX = voronoi(warpedCoord.yz * vec2(1.0, 1.8));
      vec3 vY = voronoi(warpedCoord.xz);
      vec3 vZ = voronoi(warpedCoord.xy * vec2(1.0, 1.8));

      // Crevice edges
      float edgeX = smoothstep(0.03, 0.25, vX.y - vX.x);
      float edgeY = smoothstep(0.03, 0.25, vY.y - vY.x);
      float edgeZ = smoothstep(0.03, 0.25, vZ.y - vZ.x);

      float creviceMask = edgeX * blendWeights.x + edgeY * blendWeights.y + edgeZ * blendWeights.z;
      float stoneID = vX.z * blendWeights.x + vY.z * blendWeights.y + vZ.z * blendWeights.z;

      // Bevel gradients for stone faces
      vec3 nX = vec3(0.0, vX.x - vX.y, 0.5 - vX.z);
      vec3 nY = vec3(vY.x - vY.y, 0.0, 0.5 - vY.z);
      vec3 nZ = vec3(vZ.x - vZ.y, 0.5 - vZ.z, 0.0);
      vec3 bevelNormalOffset = nX * blendWeights.x + nY * blendWeights.y + nZ * blendWeights.z;

      // Micro surface grit
      float microGrit = fbm(coord * uNoiseScale);

      // Color selection per stone
      vec3 stoneBaseColor = uCharcoalColor;
      if (stoneID > 0.72) {
        stoneBaseColor = mix(uCharcoalColor, uDarkBlueColor, 0.75);
      } else if (stoneID < 0.28) {
        stoneBaseColor = mix(uCharcoalColor, uDarkTealColor, 0.75);
      } else if (stoneID > 0.45 && stoneID < 0.55) {
        stoneBaseColor = mix(uCharcoalColor, uDarkPurpleColor, 0.65);
      }

      vec3 stoneSurface = stoneBaseColor * (0.7 + 0.5 * microGrit);
      vec3 calculatedAlbedo = mix(uCreviceColor, stoneSurface, creviceMask);

      // Feed computed color into standard Three.js PBR diffuse color
      diffuseColor.rgb = calculatedAlbedo;

      // Perturb the physical normal vector so Three.js PBR light loops evaluate relief
      vec3 perturbedNormal = normalize(vCustomNormal + (bevelNormalOffset + vec3(microGrit - 0.5)) * uBumpStrength);
      normal = perturbedNormal;
      `
    );
  };

  return material;
}
```

---

## 3. Component Integration (`src/components/dungeon/DungeonWalls.tsx`)

```tsx
import React, { useMemo } from 'react';
import { DungeonLayout } from '../../game/dungeon/getDungeonLayout';
import { getWallInstanceData } from '../../game/dungeon/wallInstances';
import { createDungeonWallMaterial } from '../environment/WallShaderMaterial';

interface DungeonWallsProps {
  layout: DungeonLayout;
}

export const DungeonWalls: React.FC<DungeonWallsProps> = ({ layout }) => {
  const { tall, low } = getWallInstanceData(layout);

  // Create singleton PBR material instance
  const wallMaterial = useMemo(() => createDungeonWallMaterial(), []);

  return (
    <group>
      {/* Tall Wall Instanced Batch */}
      {tall.count > 0 && (
        <instancedMesh
          args={[undefined, undefined, tall.count]}
          material={wallMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 2.5, 1]} />
        </instancedMesh>
      )}

      {/* Low Wall Instanced Batch */}
      {low.count > 0 && (
        <instancedMesh
          args={[undefined, undefined, low.count]}
          material={wallMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1.2, 1]} />
        </instancedMesh>
      )}
    </group>
  );
};
```

---

## 4. Verification Checklist

1. **Torch & Point Light Interaction:** Verify that moving the player or torch causes point light reflections and shadows to sweep across the wall faces.
2. **True PBR Shading:** Confirm the walls react to all R3F scene lights automatically (`PointLight`, `DirectionalLight`, `AmbientLight`).
3. **Roughness & Specular Highlights:** Stone edges must catch specular highlights under point lights instead of looking flat or painted.
4. **Physics Untouched:** `DungeonCollider.tsx` remains 100% unchanged.
5. **Clean Build:** `npm run build` must compile cleanly with no TypeScript errors.