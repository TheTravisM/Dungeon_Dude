import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { heroQuery } from '../../game/ecs';
import {
  attackProgress,
  heroAttack,
} from '../../game/hero/combat/attackState';
import { HERO_SPEED } from '../../game/hero/constants';
import type { HeroRig } from './useHeroRig';

/** Base stride speed while walking, in radians per second. */
const WALK_BASE_RATE = 4;
/** Extra stride speed at full walk speed, in radians per second. */
const WALK_SPEED_RATE = 8;
/** Below this speed the legs hold their pose instead of ticking. */
const MOVING_THRESHOLD = 0.05;
/** Smoothing time for pose blends, in seconds. */
const POSE_SMOOTH_TIME = 0.1;
/** Idle sway frequency, in radians per second. */
const IDLE_SWAY_RATE = 1.3;
/** Idle sway amplitude, in radians. */
const IDLE_SWAY_AMPLITUDE = 0.03;
/** Sword raised back during wind-up, in radians. */
const WINDUP_RAISE = 1;
/** Forward sweep past neutral during the active phase, in radians. */
const ACTIVE_SWEEP = 1.2;
/** Hips lean into the active swing, in radians. */
const ACTIVE_HIP_TILT = 0.1;
/** Fast smoothing for the sharp active phase. */
const ACTIVE_SMOOTH_TIME = 0.02;
/** Recovery eases back into the walk cycle. */
const RECOVERY_SMOOTH_TIME = 0.08;

/**
 * Procedural locomotion for the hero rig.
 *
 * Facing comes from the ECS heading, which the movement hook keeps current.
 * Locomotion amplitude is driven by the *actual* physics velocity, so pushing
 * into a wall does not run the legs at full stride. Every value is damped
 * toward its target, so stopping never snaps the pose.
 */
export function useHeroAnimation(rig: HeroRig): void {
  const phaseRef = useRef(0);

  useFrame((state, delta) => {
    const hero = heroQuery.first;
    const root = rig.root.current;
    const hips = rig.hips.current;
    const legLeft = rig.legLeft.current;
    const legRight = rig.legRight.current;
    const armSword = rig.armSword.current;
    const armTorch = rig.armTorch.current;
    const cloak = rig.cloak.current;

    if (
      !hero ||
      !root ||
      !hips ||
      !legLeft ||
      !legRight ||
      !armSword ||
      !armTorch ||
      !cloak
    ) {
      return;
    }

    // Turn the visual root, never the kinematic body. dampAngle takes the
    // shortest path across the +/-pi boundary.
    easing.dampAngle(root.rotation, 'y', hero.heading ?? 0, 0.08, delta);

    const velocity = hero.velocity;
    const speed = velocity ? Math.hypot(velocity[0], velocity[2]) : 0;
    const ratio = Math.min(speed / HERO_SPEED, 1);

    if (ratio > MOVING_THRESHOLD) {
      phaseRef.current += delta * (WALK_BASE_RATE + WALK_SPEED_RATE * ratio);
    }
    const phase = phaseRef.current;

    const swing = Math.sin(phase);
    const legSwing = swing * 0.7 * ratio;
    const swordSwing = Math.sin(phase + Math.PI) * 0.35 * ratio;
    const cloakTilt = -0.1 * ratio;

    // A swing overrides the walk-cycle sword arm. Negative x raises the blade
    // back; positive x sweeps it forward and down. Hips lean into the hit.
    let swordTarget = swordSwing;
    let swordSmoothTime = POSE_SMOOTH_TIME;
    let hipTilt = 0;
    const now = performance.now();

    if (heroAttack.phase === 'windup') {
      swordTarget = -WINDUP_RAISE * attackProgress(heroAttack, now);
      swordSmoothTime = ACTIVE_SMOOTH_TIME;
    } else if (heroAttack.phase === 'active') {
      const progress = attackProgress(heroAttack, now);
      swordTarget = -WINDUP_RAISE + (WINDUP_RAISE + ACTIVE_SWEEP) * progress;
      swordSmoothTime = ACTIVE_SMOOTH_TIME;
      hipTilt = ACTIVE_HIP_TILT * progress;
    } else if (heroAttack.phase === 'recovery') {
      const progress = attackProgress(heroAttack, now);
      swordTarget = ACTIVE_SWEEP + (swordSwing - ACTIVE_SWEEP) * progress;
      swordSmoothTime = RECOVERY_SMOOTH_TIME;
    }

    easing.damp(legLeft.rotation, 'x', legSwing, POSE_SMOOTH_TIME, delta);
    easing.damp(legRight.rotation, 'x', -legSwing, POSE_SMOOTH_TIME, delta);
    easing.damp(
      armSword.rotation,
      'x',
      swordTarget,
      swordSmoothTime,
      delta
    );
    easing.damp(hips.rotation, 'x', hipTilt, POSE_SMOOTH_TIME, delta);
    easing.damp(cloak.rotation, 'x', cloakTilt, POSE_SMOOTH_TIME, delta);

    const bob = 0.5 + Math.abs(swing) * 0.04 * ratio;
    easing.damp(hips.position, 'y', bob, POSE_SMOOTH_TIME, delta);

    // The torch arm sways with the stride, with a faint idle drift that fades
    // out as the hero picks up speed. Lights are children of torchHand, so
    // those shadows inherit this motion.
    const idleSway =
      Math.sin(state.clock.elapsedTime * IDLE_SWAY_RATE) *
      IDLE_SWAY_AMPLITUDE *
      (1 - ratio);
    const torchZ = swing * 0.12 * ratio + idleSway;
    const torchX = Math.cos(phase) * 0.08 * ratio + idleSway * 0.5;

    easing.damp(armTorch.rotation, 'z', torchZ, POSE_SMOOTH_TIME, delta);
    easing.damp(armTorch.rotation, 'x', torchX, POSE_SMOOTH_TIME, delta);
  });
}
