import {
  HERO_CAPSULE_CENTER_Y,
  HERO_CAPSULE_HALF_HEIGHT,
  HERO_HEIGHT,
  HERO_RADIUS,
  HERO_SPEED,
} from './constants';
import { HERO_BONES } from '../../config/assets';

/**
 * Hero physics and attachment configuration. Physics values come from the
 * measured bounding box recorded in the Phase 0 baseline, never from a guess
 * at runtime. Bone names are the Mixamo names that the temporary dev route
 * verifies before attachments are ported to a skinned model.
 */
export const HERO_CONFIG = {
  height: HERO_HEIGHT,
  radius: HERO_RADIUS,
  halfHeight: HERO_CAPSULE_HALF_HEIGHT,
  capsuleCenterY: HERO_CAPSULE_CENTER_Y,
  speed: HERO_SPEED,
  runEnterSpeed: 0.5,
  runExitSpeed: 0.2,
  runTimeScale: { min: 0.6, max: 1.6 },
  bones: HERO_BONES,
  attachments: {
    shield: { bone: HERO_BONES.spine, position: [0, 0.04, -0.31] },
    pauldron: { bone: HERO_BONES.leftShoulder, position: [-0.225, 0.2, 0.01] },
    hood: { bone: HERO_BONES.head, position: [0, 0, 0] },
    sword: { bone: HERO_BONES.rightHand, position: [0, 0, 0] },
    torch: { bone: HERO_BONES.leftHand, position: [0, 0.44, 0] },
  },
} as const;
