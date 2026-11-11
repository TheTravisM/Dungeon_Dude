import { beforeEach, describe, expect, it } from 'vitest';
import { useScreenStore } from './screenStore';
import {
  commitScreenEvent,
  prefersReducedMotion,
  runScreenTransition,
} from './screenTransition';

beforeEach(() => {
  useScreenStore.setState({ screen: 'mainMenu' });
});

describe('runScreenTransition', () => {
  it('runs the update only when the transition callback fires', () => {
    const order: string[] = [];
    let callback: (() => void) | undefined;

    runScreenTransition(
      () => order.push('update'),
      {
        startViewTransition: (run) => {
          order.push('start');
          callback = run;
        },
        reducedMotion: false,
      }
    );

    expect(order).toEqual(['start']);
    callback!();
    expect(order).toEqual(['start', 'update']);
  });

  it('updates directly when the API is unavailable', () => {
    let updated = false;

    runScreenTransition(
      () => {
        updated = true;
      },
      { startViewTransition: undefined, reducedMotion: false }
    );

    expect(updated).toBe(true);
  });

  it('never starts a transition when reduced motion is requested', () => {
    let started = false;
    let updated = false;

    runScreenTransition(
      () => {
        updated = true;
      },
      {
        startViewTransition: () => {
          started = true;
        },
        reducedMotion: true,
      }
    );

    expect(started).toBe(false);
    expect(updated).toBe(true);
  });

  it('treats a missing matchMedia as motion allowed', () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('commitScreenEvent', () => {
  it('applies the event inside the transition callback', () => {
    let callback: (() => void) | undefined;

    commitScreenEvent('startGame', {
      startViewTransition: (run) => {
        callback = run;
      },
      reducedMotion: false,
    });

    expect(useScreenStore.getState().screen).toBe('mainMenu');
    callback!();
    expect(useScreenStore.getState().screen).toBe('playing');
  });

  it('applies the event directly under reduced motion', () => {
    commitScreenEvent('startGame', {
      startViewTransition: () => undefined,
      reducedMotion: true,
    });

    expect(useScreenStore.getState().screen).toBe('playing');
  });

  it('keeps blocked events as no-ops', () => {
    commitScreenEvent('restart', { reducedMotion: true });

    expect(useScreenStore.getState().screen).toBe('mainMenu');
  });
});
