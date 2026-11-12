import * as THREE from 'three';

/**
 * Configures the shared wall PBR maps for repeatable, mipmapped sampling.
 */
export function configureDungeonWallTextures(
  albedoMap: THREE.Texture,
  normalMap: THREE.Texture,
  roughnessMap: THREE.Texture,
  aoMap: THREE.Texture
): void {
  for (const texture of [albedoMap, normalMap, roughnessMap, aoMap]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
  }

  albedoMap.colorSpace = THREE.SRGBColorSpace;
  normalMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.colorSpace = THREE.NoColorSpace;
  aoMap.colorSpace = THREE.NoColorSpace;
}

/**
 * Creates a PBR-compliant MeshStandardMaterial customized with triplanar
 * irregular stone patterns and textured albedo, normal, roughness, and AO maps.
 *
 * The material hooks Three.js's standard PBR shader via `onBeforeCompile`
 * instead of using a raw ShaderMaterial, so every native scene light (torch
 * point lights, directional lights, ambient) and the shadow pipeline
 * illuminate the wall through the usual `lights_fragment` loops.
 */
export function createDungeonWallMaterial(
  albedoMap: THREE.Texture,
  normalMap: THREE.Texture,
  roughnessMap: THREE.Texture,
  aoMap: THREE.Texture
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    map: albedoMap,
    normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap,
    aoMap,
    aoMapIntensity: 0.8,
    roughness: 0.85,
    metalness: 0.03,
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
        vec4 customWorldPos = modelMatrix * instanceMatrix * vec4( position, 1.0 );
        mat3 customNormalMat = mat3( modelMatrix * instanceMatrix );
      #else
        vec4 customWorldPos = modelMatrix * vec4( position, 1.0 );
        mat3 customNormalMat = mat3( modelMatrix );
      #endif
      vCustomWorldPosition = customWorldPos.xyz;
      vCustomNormal = normalize( customNormalMat * normal );
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

    // 4. Hook the stone albedo, roughness, and perturbed normal into Three's
    // PBR pipeline. This runs after `normal_fragment_begin` (where the
    // view-space `normal` is declared) and after `normal_fragment_maps`, but
    // before `lights_physical_fragment` and `lights_fragment_begin`, so the
    // standard light loops light the computed surface.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>

      // Calculate Triplanar Weights from the world-space normal
      vec3 customBlendWeights = pow( abs( vCustomNormal ), vec3( 6.0 ) );
      customBlendWeights /= ( customBlendWeights.x + customBlendWeights.y + customBlendWeights.z );

      vec3 customCoord = vCustomWorldPosition * uTileScale;

      // Domain warp for non-rectangular rugged stone shapes
      vec3 customWarp = vec3(
        fbm( customCoord ),
        fbm( customCoord + vec3( 4.3, 1.2, 2.8 ) ),
        fbm( customCoord + vec3( 1.7, 5.2, 3.1 ) )
      );
      vec3 customWarpedCoord = customCoord + customWarp * 0.4;

      // Projected Voronoi
      vec3 customVX = voronoi( customWarpedCoord.yz * vec2( 1.0, 1.8 ) );
      vec3 customVY = voronoi( customWarpedCoord.xz );
      vec3 customVZ = voronoi( customWarpedCoord.xy * vec2( 1.0, 1.8 ) );

      // Crevice edges
      float customEdgeX = smoothstep( 0.03, 0.25, customVX.y - customVX.x );
      float customEdgeY = smoothstep( 0.03, 0.25, customVY.y - customVY.x );
      float customEdgeZ = smoothstep( 0.03, 0.25, customVZ.y - customVZ.x );

      float customCreviceMask = customEdgeX * customBlendWeights.x + customEdgeY * customBlendWeights.y + customEdgeZ * customBlendWeights.z;
      float customStoneID = customVX.z * customBlendWeights.x + customVY.z * customBlendWeights.y + customVZ.z * customBlendWeights.z;

      // Bevel gradients for stone faces
      vec3 customNX = vec3( 0.0, customVX.x - customVX.y, 0.5 - customVX.z );
      vec3 customNY = vec3( customVY.x - customVY.y, 0.0, 0.5 - customVY.z );
      vec3 customNZ = vec3( customVZ.x - customVZ.y, 0.5 - customVZ.z, 0.0 );
      vec3 customBevelNormalOffset = customNX * customBlendWeights.x + customNY * customBlendWeights.y + customNZ * customBlendWeights.z;

      // Micro surface grit
      float customMicroGrit = fbm( customCoord * uNoiseScale );

      // Color selection per stone
      vec3 customStoneBaseColor = uCharcoalColor;
      if ( customStoneID > 0.72 ) {
        customStoneBaseColor = mix( uCharcoalColor, uDarkBlueColor, 0.75 );
      } else if ( customStoneID < 0.28 ) {
        customStoneBaseColor = mix( uCharcoalColor, uDarkTealColor, 0.75 );
      } else if ( customStoneID > 0.45 && customStoneID < 0.55 ) {
        customStoneBaseColor = mix( uCharcoalColor, uDarkPurpleColor, 0.65 );
      }

      vec3 customTextureAlbedo = texture2D( map, vMapUv ).rgb;
      vec3 customStoneSurface = mix( customStoneBaseColor, customTextureAlbedo, 0.62 ) * ( 0.7 + 0.5 * customMicroGrit );
      vec3 customCalculatedAlbedo = mix( uCreviceColor, customStoneSurface, customCreviceMask );

      // Feed computed color into standard Three.js PBR diffuse color
      diffuseColor.rgb = customCalculatedAlbedo;

      // Cracks stay rougher and the grit varies per point, so torchlight
      // scatters differently across each stone face instead of reading flat
      roughnessFactor = clamp( roughnessFactor + ( customMicroGrit - 0.5 ) * 0.3 + ( 1.0 - customCreviceMask ) * 0.1, 0.4, 1.0 );

      // Add the procedural bevel to the tangent-space normal map result.
      vec3 textureMappedNormal = normal;
      vec3 customBaseViewNormal = normalize( mat3( viewMatrix ) * vCustomNormal );
      vec3 customPerturbedNormal = normalize( vCustomNormal + ( customBevelNormalOffset + vec3( customMicroGrit - 0.5 ) ) * uBumpStrength );
      vec3 customReliefViewNormal = normalize( mat3( viewMatrix ) * customPerturbedNormal );
      normal = normalize( textureMappedNormal + customReliefViewNormal - customBaseViewNormal );
      `
    );
  };

  return material;
}