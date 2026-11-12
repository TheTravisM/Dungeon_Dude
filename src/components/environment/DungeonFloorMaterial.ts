import * as THREE from 'three';

const TEXTURE_SCALE = 0.22;

export function configureDungeonFloorTextures(
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

export function createDungeonFloorMaterial(
  albedoMap: THREE.Texture,
  normalMap: THREE.Texture,
  roughnessMap: THREE.Texture,
  aoMap: THREE.Texture
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: '#596879',
    map: albedoMap,
    roughness: 0.9,
    roughnessMap,
    aoMap,
    aoMapIntensity: 0.8,
    metalness: 0.03,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.dungeonFloorNormalMap = { value: normalMap };
    shader.uniforms.dungeonFloorTextureScale = { value: TEXTURE_SCALE };

    shader.vertexShader = `
      varying vec3 vDungeonFloorWorldPosition;
      varying vec3 vDungeonFloorWorldNormal;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>

      #ifdef USE_INSTANCING
        vec4 dungeonFloorWorldPosition = modelMatrix * instanceMatrix * vec4( transformed, 1.0 );
        mat3 dungeonFloorNormalMatrix = mat3( modelMatrix * instanceMatrix );
      #else
        vec4 dungeonFloorWorldPosition = modelMatrix * vec4( transformed, 1.0 );
        mat3 dungeonFloorNormalMatrix = mat3( modelMatrix );
      #endif
      vDungeonFloorWorldPosition = dungeonFloorWorldPosition.xyz;
      vDungeonFloorWorldNormal = normalize( dungeonFloorNormalMatrix * objectNormal );
      `
    );

    shader.fragmentShader = `
      varying vec3 vDungeonFloorWorldPosition;
      varying vec3 vDungeonFloorWorldNormal;
      uniform sampler2D dungeonFloorNormalMap;
      uniform float dungeonFloorTextureScale;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `vec2 dungeonFloorUv = vDungeonFloorWorldPosition.xz * dungeonFloorTextureScale;
      vec4 sampledDiffuseColor = texture2D( map, dungeonFloorUv );
      diffuseColor *= sampledDiffuseColor;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 texelRoughness = texture2D( roughnessMap, dungeonFloorUv );
        roughnessFactor *= texelRoughness.g;
      #endif
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>

      vec3 dungeonFloorMapNormal = texture2D( dungeonFloorNormalMap, dungeonFloorUv ).xyz * 2.0 - 1.0;
      dungeonFloorMapNormal.xy *= 0.55;
      vec3 dungeonFloorWorldMapNormal = normalize( vec3( dungeonFloorMapNormal.x, dungeonFloorMapNormal.z, dungeonFloorMapNormal.y ) );
      vec3 dungeonFloorViewMapNormal = normalize( mat3( viewMatrix ) * dungeonFloorWorldMapNormal );
      float dungeonFloorTopFace = max( vDungeonFloorWorldNormal.y, 0.0 );
      normal = normalize( mix( normal, dungeonFloorViewMapNormal, dungeonFloorTopFace ) );
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <aomap_fragment>',
      `#ifdef USE_AOMAP
        float ambientOcclusion = ( texture2D( aoMap, dungeonFloorUv ).r - 1.0 ) * aoMapIntensity + 1.0;
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        #if defined( USE_CLEARCOAT )
          clearcoatSpecularIndirect *= ambientOcclusion;
        #endif
        #if defined( USE_SHEEN )
          sheenSpecularIndirect *= ambientOcclusion;
        #endif
        #if defined( USE_ENVMAP ) && defined( STANDARD )
          float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
          reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
        #endif
      #endif
      `
    );
  };

  return material;
}
