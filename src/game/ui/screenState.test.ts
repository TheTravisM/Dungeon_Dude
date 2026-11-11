import { beforeEach, describe, expect, it } from 'vitest';
import {
  SCREEN_EVENTS,
  SCREEN_STATES,
  canTransition,
  nextScreen,
} from './screenState';
import { useScreenStore } from './screenStore';

beforeEach(() => {
  useScreenStore.setState({ screen: 'mainMenu' });
});

describe('screen states', () => {
  it('represents only MainMenu, Playing, and GameOver', () => {
    expect(SCREEN_STATES).toEqual(['mainMenu', 'playing', 'gameOver']);
  });

  it('allows exactly the approved transitions', () => {
    expect(nextScreen('mainMenu', 'startGame')).toBe('playing');
    expect(nextScreen('playing', 'heroDied')).toBe('gameOver');
    expect(nextScreen('gameOver', 'restart')).toBe('playing');
    expect(nextScreen('gameOver', 'returnToMenu')).toBe('mainMenu');
  });

  it('ignores events that are not valid from the current screen', () => {
    const states = [...SCREEN_STATES];

    for (const current of states) {
      for (const event of SCREEN_EVENTS) {
        const allowed = canTransition(current, event);
        const next = nextScreen(current, event);
        if (allowed) expect(next).not.toBe(current);
        else expect(next).toBe(current);
      }
    }
  });

  it('cannot skip the Main Menu or die before playing', () => {
    expect(nextScreen('mainMenu', 'heroDied')).toBe('mainMenu');
    expect(nextScreen('mainMenu', 'restart')).toBe('mainMenu');
    expect(nextScreen('playing', 'startGame')).toBe('playing');
    expect(nextScreen('playing', 'returnToMenu')).toBe('playing');
    expect(nextScreen('gameOver', 'startGame')).toBe('gameOver');
  });
});

describe('screen store', () => {
  it('starts on the Main Menu and follows the event boundaries', () => {
    const send = useScreenStore.getState().send;
    expect(useScreenStore.getState().screen).toBe('mainMenu');

    send('startGame');
    expect(useScreenStore.getState().screen).toBe('playing');

    send('heroDied');
    expect(useScreenStore.getState().screen).toBe('gameOver');

    send('restart');
    expect(useScreenStore.getState().screen).toBe('playing');

    send('heroDied');
    send('returnToMenu');
    expect(useScreenStore.getState().screen).toBe('mainMenu');
  });

  it('leaves the screen unchanged for blocked events', () => {
    const store = useScreenStore.getState();
    store.send('heroDied');

    expect(useScreenStore.getState().screen).toBe('mainMenu');
    expect(useScreenStore.getState()).toBe(store);
  });

  it('resets to the Main Menu', () => {
    useScreenStore.getState().send('startGame');
    useScreenStore.getState().reset();

    expect(useScreenStore.getState().screen).toBe('mainMenu');
  });
});
