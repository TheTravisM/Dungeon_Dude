/**
 * Screen-level UI state for the three top-level screens. This module is pure:
 * it owns the screen names, the events that may change them, and the explicit
 * transition table. It never touches positions, velocities, health, or combat
 * data, all of which stay in the ECS world and refs.
 */
export type ScreenState = 'mainMenu' | 'playing' | 'gameOver';

export const SCREEN_STATES: readonly ScreenState[] = Object.freeze([
  'mainMenu',
  'playing',
  'gameOver',
]);

/**
 * Events are the only boundaries allowed to change a screen.
 *
 * - `startGame`: the Main Menu "Enter Dungeon" action.
 * - `heroDied`: the Playing screen observes hero death.
 * - `restart`: the Game Over restart/continue action.
 * - `returnToMenu`: the Game Over back-to-menu action.
 */
export type ScreenEvent =
  | 'startGame'
  | 'heroDied'
  | 'restart'
  | 'returnToMenu';

export const SCREEN_EVENTS: readonly ScreenEvent[] = Object.freeze([
  'startGame',
  'heroDied',
  'restart',
  'returnToMenu',
]);

/**
 * The complete set of allowed transitions. A missing entry means the event is
 * ignored in that state, so callers cannot reach an unintended screen.
 */
const TRANSITIONS: Readonly<
  Record<ScreenState, Readonly<Partial<Record<ScreenEvent, ScreenState>>>>
> = Object.freeze({
  mainMenu: Object.freeze({ startGame: 'playing' }),
  playing: Object.freeze({ heroDied: 'gameOver' }),
  gameOver: Object.freeze({
    restart: 'playing',
    returnToMenu: 'mainMenu',
  }),
});

/** True when `event` is a defined boundary out of `current`. */
export function canTransition(
  current: ScreenState,
  event: ScreenEvent
): boolean {
  return TRANSITIONS[current][event] !== undefined;
}

/**
 * Returns the next screen for one event, or `current` when the event is not
 * allowed from that state. Pure and allocation-free.
 */
export function nextScreen(
  current: ScreenState,
  event: ScreenEvent
): ScreenState {
  return TRANSITIONS[current][event] ?? current;
}
