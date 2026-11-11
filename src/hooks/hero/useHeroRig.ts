import { createRef, useRef, type RefObject } from 'react';
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
 *
 * The rig object is built with `createRef` behind one unconditional `useRef`.
 * Returning an object literal full of `useRef` calls lets the React Compiler
 * memoize the object and skip those hooks on later renders, which breaks the
 * Rules of Hooks. Only the single `useRef` below is a hook.
 */
export function useHeroRig(): HeroRig {
  const rigRef = useRef<HeroRig | null>(null);

  if (rigRef.current === null) {
    rigRef.current = {
      root: createRef<Group>(),
      hips: createRef<Group>(),
      torso: createRef<Group>(),
      cloak: createRef<Group>(),
      head: createRef<Group>(),
      legLeft: createRef<Group>(),
      legRight: createRef<Group>(),
      armSword: createRef<Group>(),
      armTorch: createRef<Group>(),
      torchHand: createRef<Group>(),
    };
  }

  return rigRef.current;
}
