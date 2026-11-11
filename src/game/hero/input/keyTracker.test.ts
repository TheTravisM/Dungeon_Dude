import { describe, expect, it } from 'vitest';
import { createKeyTracker } from './keyTracker';

describe('createKeyTracker', () => {
  it('cancels opposing movement keys', () => {
    const tracker = createKeyTracker();
    tracker.keyDown('KeyW');
    tracker.keyDown('KeyS');

    expect(tracker.axes()).toEqual({ x: 0, y: 0 });
  });

  it('clear() zeroes everything', () => {
    const tracker = createKeyTracker();
    tracker.keyDown('KeyD');
    tracker.keyDown('Space');
    tracker.clear();

    expect(tracker.axes()).toEqual({ x: 0, y: 0 });
    expect(tracker.attackHeld()).toBe(false);
    expect(tracker.anyHeld()).toBe(false);
  });

  it('ignores unmapped codes', () => {
    const tracker = createKeyTracker();
    tracker.keyDown('KeyQ');

    expect(tracker.anyHeld()).toBe(false);
    expect(tracker.axes()).toEqual({ x: 0, y: 0 });
  });

  it('keeps the other key held after releasing one of two', () => {
    const tracker = createKeyTracker();
    tracker.keyDown('KeyW');
    tracker.keyDown('ArrowUp');
    tracker.keyUp('KeyW');

    expect(tracker.axes()).toEqual({ x: 0, y: 1 });
  });

  it('reads arrows and Space', () => {
    const tracker = createKeyTracker();
    tracker.keyDown('ArrowRight');
    tracker.keyDown('Space');

    expect(tracker.axes()).toEqual({ x: 1, y: 0 });
    expect(tracker.attackHeld()).toBe(true);
    expect(tracker.anyHeld()).toBe(true);
  });
});
