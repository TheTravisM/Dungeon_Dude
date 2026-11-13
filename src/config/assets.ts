import floorAlbedoMap from '../assets/textures/floor_bricks_02_diff_2k.webp';
import floorNormalMap from '../assets/textures/floor_bricks_02_nor_gl_2k.webp';
import floorRoughnessMap from '../assets/textures/floor_bricks_02_rough_2k.webp';
import floorAoMap from '../assets/textures/floor_bricks_02_ao_2k.webp';

/**
 * The single registry for asset URLs and names. Components import from here so
 * a filename change never has to be hunted through the scene, and Vite hashes
 * the imported textures for long-lived browser and CDN caching.
 */

export const FLOOR_TEXTURES = {
  albedo: floorAlbedoMap,
  normal: floorNormalMap,
  roughness: floorRoughnessMap,
  ao: floorAoMap,
} as const;

export const WALL_TEXTURES = FLOOR_TEXTURES;

/**
 * Hero base model and clips. The Mixamo files are not present yet, so the URL
 * stays null and `HeroModel` keeps using the procedural knight. When the FBX
 * files are optimized into `public/models/knight.glb`, set this URL and switch
 * `HeroModel` to the GLTF path described in the blueprint.
 */
export const HERO_MODEL_URL: string | null = null;

export const CLIP_IDLE = 'Idle';
export const CLIP_RUN = 'Run';

/**
 * Bone names expected from the Mixamo rig. Mixamo strips the colon, so the
 * names are the `mixamorig` form. Verify these with the temporary dev route
 * before attaching any add-on pieces.
 */
export const HERO_BONES = {
  rightHand: 'mixamorigRightHand',
  leftHand: 'mixamorigLeftHand',
  leftShoulder: 'mixamorigLeftShoulder',
  spine: 'mixamorigSpine2',
  head: 'mixamorigHead',
} as const;
