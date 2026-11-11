import { useGameStore } from '../../store';
import { HERO_IDLE_RETURN_MS } from '../constants';
import type { Axes } from '../isoMovement';
import { readGamepad, type PadLike } from './gamepad';
import { createKeyTracker } from './keyTracker';
import { createManualClock } from './manualControl';

/** Per-frame input snapshot. Module-level so React never re-renders for it. */
export const inputState: {
  axes: Axes;
  attack: boolean;
  manualActive: boolean;
} = {
  axes: { x: 0, y: 0 },
  attack: false,
  manualActive: false,
};

const MAPPED_CODES = new Set([
  'KeyW',
  'ArrowUp',
  'KeyS',
  'ArrowDown',
  'KeyA',
  'ArrowLeft',
  'KeyD',
  'ArrowRight',
  'Space',
]);

const tracker = createKeyTracker();
const manualClock = createManualClock();

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function handleKeyDown(event: KeyboardEvent): void {
  if (!MAPPED_CODES.has(event.code)) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (isTextEntryTarget(event.target)) return;

  event.preventDefault();
  if (!event.repeat) tracker.keyDown(event.code);
  manualClock.registerInput(performance.now());
}

function handleKeyUp(event: KeyboardEvent): void {
  if (!MAPPED_CODES.has(event.code)) return;
  tracker.keyUp(event.code);
}

function clearHeldKeys(): void {
  tracker.clear();
}

/**
 * Installs native keyboard and window listeners. Returns a cleanup that
 * removes exactly the listeners it added, so StrictMode remounts are safe.
 */
export function installInputListeners(): () => void {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', clearHeldKeys);

  const onVisibilityChange = (): void => {
    if (document.hidden) clearHeldKeys();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', clearHeldKeys);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    clearHeldKeys();
  };
}

function firstConnectedPad(): PadLike | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  for (const pad of navigator.getGamepads()) {
    if (pad) return pad;
  }
  return null;
}

/**
 * Samples keyboard and gamepad once per frame. Store writes happen only when
 * the manual/auto mode flips, never per frame.
 */
export function pollInput(nowMs: number): void {
  const reading = readGamepad(firstConnectedPad());
  const keys = tracker.axes();

  let x = keys.x + reading.axes.x;
  let y = keys.y + reading.axes.y;
  const length = Math.hypot(x, y);
  if (length > 1) {
    x /= length;
    y /= length;
  }

  inputState.axes.x = x;
  inputState.axes.y = y;
  inputState.attack = tracker.attackHeld() || reading.attack;

  const active = tracker.anyHeld() || reading.active;
  if (active) manualClock.registerInput(nowMs);

  const manual = manualClock.isManual(nowMs);
  inputState.manualActive = manual;

  const store = useGameStore.getState();
  if (manual && store.autoPlaying) {
    store.updateLastInputTime();
    store.setAutoPlaying(false);
  } else if (!manual && !store.autoPlaying) {
    store.setAutoPlaying(true);
  }
}

export function isManualNow(nowMs: number): boolean {
  return manualClock.isManual(nowMs);
}

/** Milliseconds left in the manual window, for the development readout. */
export function manualWindowMsLeft(nowMs: number): number {
  return Math.max(0, HERO_IDLE_RETURN_MS - (nowMs - manualClock.lastActiveAt()));
}
