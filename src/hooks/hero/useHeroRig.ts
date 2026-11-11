import { useRef, type RefObject } from 'react';
import type { Group } from 'three';

/**
 * Named group refs for the hero rig. Animation (05-06) drives these groups;
 * the model component only attaches them to its hierarchy.
 */
export interface HeroRig {
  root: RefObject<Group | null>;
  hips: RefObject<Group | null>;
  torso: RefObject<Group | null>;
  cloak: RefObject<Group | null>;
  head: RefObject<Group | null>;
  legLeft: RefObject<Group | null>;
  legRight: RefObject<Group | null>;
  armSword: RefObject<Group | null>;
  armTorch: RefObject<Group | null>;
  torchHand: RefObject<Group | null>;
}

/**
 * Creates the hero's group refs once per component instance. No logic lives
 * here so the visual model stays purely declarative.
 */
export function useHeroRig(): HeroRig {
  return {
    root: useRef<Group>(null),
    hips: useRef<Group>(null),
    torso: useRef<Group>(null),
    cloak: useRef<Group>(null),
    head: useRef<Group>(null),
    legLeft: useRef<Group>(null),
    legRight: useRef<Group>(null),
    armSword: useRef<Group>(null),
    armTorch: useRef<Group>(null),
    torchHand: useRef<Group>(null),
  };
}
