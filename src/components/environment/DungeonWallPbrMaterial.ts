import * as THREE from 'three';

const WALL_TEXTURE_SCALE = 0.22;

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

export function createDungeonWallMaterial(
  albedoMap: THREE.Texture,
  normalMap: THREE.Texture,
  roughnessMap: THREE.Texture,
  aoMap: THREE.Texture
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.96,
    metalness: 0.02,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.wallAlbedoMap = { value: albedoMap };
    shader.uniforms.wallNormalMap = { value: normalMap };
    shader.uniforms.wallRoughnessMap = { value: roughnessMap };
    shader.uniforms.wallAoMap = { value: aoMap };
    shader.uniforms.wallTextureScale = { value: WALL_TEXTURE_SCALE };

    shader.vertexShader = `
      varying vec3 vWallWorldPosition;
      varying vec3 vWallWorldNormal;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>

      #ifdef USE_INSTANCING
        mat4 wallInstanceModelMatrix = modelMatrix * instanceMatrix;
      #else
        mat4 wallInstanceModelMatrix = modelMatrix;
      #endif
      vWallWorldPosition = ( wallInstanceModelMatrix * vec4( position, 1.0 ) ).xyz;
      vWallWorldNormal = normalize( mat3( wallInstanceModelMatrix ) * normal );
      `
    );

    shader.fragmentShader = `
      varying vec3 vWallWorldPosition;
      varying vec3 vWallWorldNormal;
      uniform sampler2D wallAlbedoMap;
      uniform sampler2D wallNormalMap;
      uniform sampler2D wallRoughnessMap;
      uniform sampler2D wallAoMap;
      uniform float wallTextureScale;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `vec3 wallWeights = pow( abs( vWallWorldNormal ), vec3( 4.0 ) );
      wallWeights /= wallWeights.x + wallWeights.y + wallWeights.z;
      float wallSignX = sign( vWallWorldNormal.x );
      float wallSignY = sign( vWallWorldNormal.y );
      float wallSignZ = sign( vWallWorldNormal.z );
      vec2 wallUvX = vec2( vWallWorldPosition.z * wallSignX, -vWallWorldPosition.y ) * wallTextureScale;
      vec2 wallUvY = vec2( vWallWorldPosition.x, -vWallWorldPosition.z * wallSignY ) * wallTextureScale;
      vec2 wallUvZ = vec2( vWallWorldPosition.x * wallSignZ, vWallWorldPosition.y ) * wallTextureScale;

      vec3 wallAlbedoX = texture2D( wallAlbedoMap, wallUvX ).rgb;
      vec3 wallAlbedoY = texture2D( wallAlbedoMap, wallUvY ).rgb;
      vec3 wallAlbedoZ = texture2D( wallAlbedoMap, wallUvZ ).rgb;
      vec3 wallAlbedo = wallAlbedoX * wallWeights.x + wallAlbedoY * wallWeights.y + wallAlbedoZ * wallWeights.z;
      diffuseColor.rgb *= wallAlbedo;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `float roughnessFactor = roughness;
      float wallRoughnessX = texture2D( wallRoughnessMap, wallUvX ).g;
      float wallRoughnessY = texture2D( wallRoughnessMap, wallUvY ).g;
      float wallRoughnessZ = texture2D( wallRoughnessMap, wallUvZ ).g;
      float wallRoughness = wallRoughnessX * wallWeights.x + wallRoughnessY * wallWeights.y + wallRoughnessZ * wallWeights.z;
      roughnessFactor = max( roughnessFactor, wallRoughness );
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>

      vec3 wallNormalX = texture2D( wallNormalMap, wallUvX ).xyz * 2.0 - 1.0;
      vec3 wallNormalY = texture2D( wallNormalMap, wallUvY ).xyz * 2.0 - 1.0;
      vec3 wallNormalZ = texture2D( wallNormalMap, wallUvZ ).xyz * 2.0 - 1.0;
      wallNormalX.xy *= 0.5;
      wallNormalY.xy *= 0.5;
      wallNormalZ.xy *= 0.5;
      wallNormalX = normalize( wallNormalX );
      wallNormalY = normalize( wallNormalY );
      wallNormalZ = normalize( wallNormalZ );

      vec3 wallWorldNormalX = vec3( wallNormalX.z * wallSignX, -wallNormalX.y, wallNormalX.x * wallSignX );
      vec3 wallWorldNormalY = vec3( wallNormalY.x, -wallNormalY.z * wallSignY, wallNormalY.y * wallSignY );
      vec3 wallWorldNormalZ = vec3( wallNormalZ.x * wallSignZ, wallNormalZ.y, wallNormalZ.z * wallSignZ );
      vec3 wallMappedWorldNormal = normalize(
        wallWorldNormalX * wallWeights.x +
        wallWorldNormalY * wallWeights.y +
        wallWorldNormalZ * wallWeights.z
      );
      normal = normalize( mat3( viewMatrix ) * wallMappedWorldNormal );
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <aomap_fragment>',
      `float wallAoX = texture2D( wallAoMap, wallUvX ).r;
      float wallAoY = texture2D( wallAoMap, wallUvY ).r;
      float wallAoZ = texture2D( wallAoMap, wallUvZ ).r;
      float wallAo = wallAoX * wallWeights.x + wallAoY * wallWeights.y + wallAoZ * wallWeights.z;
      float wallAmbientOcclusion = mix( 1.0, wallAo, 0.75 );
      reflectedLight.indirectDiffuse *= wallAmbientOcclusion;
      `
    );
  };

  return material;
}
