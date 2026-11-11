import { flushSync } from 'react-dom';
import type { ScreenEvent } from './screenState';
import { useScreenStore } from './screenStore';

/** Minimal shape of `document.startViewTransition` used by this project. */
export type StartViewTransition = (callback: () => void) => unknown;

export interface ScreenTransitionOptions {
  /** Injectable for tests; defaults to the real document API. */
  startViewTransition?: StartViewTransition;
  /** Injectable for tests; defaults to the live media query. */
  reducedMotion?: boolean;
}

/**
 * True only when the browser matches the reduced-motion preference. Missing
 * matchMedia (older browsers, tests) counts as motion allowed.
 */
export function prefersReducedMotion(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calls the installed View Transitions API with the document bound as `this`.
 * Returns undefined when the API is unavailable.
 */
function browserStartViewTransition(): StartViewTransition | undefined {
  if (typeof document === 'undefined') return undefined;
  const start = document.startViewTransition;
  if (typeof start !== 'function') return undefined;
  return (callback) => start.call(document, callback);
}

/**
 * Runs one screen update. When the API exists and motion is allowed, the
 * update runs inside the transition callback under `flushSync`, so React has
 * committed the new DOM before the browser captures the "new" snapshot.
 * Otherwise the update runs directly, which is also the reduced-motion path.
 */
export function runScreenTransition(
  update: () => void,
  options: ScreenTransitionOptions = {}
): void {
  const start = options.startViewTransition ?? browserStartViewTransition();
  const reduced = options.reducedMotion ?? prefersReducedMotion();

  if (reduced || !start) {
    update();
    return;
  }

  start(() => flushSync(update));
}

/**
 * Applies one approved screen event through the transition helper. Callers
 * stay on the event names from `screenState.ts`; they never set the screen
 * directly, so the transition table remains the only source of truth.
 */
export function commitScreenEvent(
  event: ScreenEvent,
  options: ScreenTransitionOptions = {}
): void {
  runScreenTransition(
    () => useScreenStore.getState().send(event),
    options
  );
}
