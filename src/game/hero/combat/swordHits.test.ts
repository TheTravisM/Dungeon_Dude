import { describe, expect, it } from 'vitest';
import { createHitTracker } from './swordHits';

const out: string[] = [];

describe('createHitTracker', () => {
  it('collects a monster already inside once at the active window', () => {
    const tracker = createHitTracker();
    tracker.enter('slime-1');

    expect(tracker.collect(4, 'windup', out)).toEqual([]);
    expect(tracker.collect(4, 'active', out)).toEqual(['slime-1']);
    expect(tracker.collect(4, 'active', out)).toEqual([]);
  });

  it('collects a monster that enters during the active phase', () => {
    const tracker = createHitTracker();
    tracker.collect(1, 'active', out);
    tracker.enter('bat-2');

    expect(tracker.collect(1, 'active', out)).toEqual(['bat-2']);
    expect(tracker.collect(1, 'active', out)).toEqual([]);
  });

  it('does not collect a monster that leaves before the active phase', () => {
    const tracker = createHitTracker();
    tracker.enter('skeleton-3');
    tracker.exit('skeleton-3');

    expect(tracker.collect(2, 'active', out)).toEqual([]);
  });

  it('collects nothing outside the active phase', () => {
    const tracker = createHitTracker();
    tracker.enter('slime-4');

    for (const phase of ['ready', 'windup', 'recovery'] as const) {
      expect(tracker.collect(3, phase, out)).toEqual([]);
    }
  });

  it('allows the same monster to be hit by a new swing', () => {
    const tracker = createHitTracker();
    tracker.enter('slime-5');

    expect(tracker.collect(10, 'active', out)).toEqual(['slime-5']);
    tracker.collect(10, 'recovery', out);
    expect(tracker.collect(11, 'active', out)).toEqual(['slime-5']);
  });

  it('collects several monsters once each in entry order', () => {
    const tracker = createHitTracker();
    tracker.enter('bat-6');
    tracker.enter('slime-7');
    tracker.enter('skeleton-8');

    expect(tracker.collect(20, 'active', out)).toEqual([
      'bat-6',
      'slime-7',
      'skeleton-8',
    ]);
    expect(tracker.collect(20, 'active', out)).toEqual([]);
  });

  it('ignores unknown exits and clears all state', () => {
    const tracker = createHitTracker();
    tracker.exit('ghost');
    tracker.enter('slime-9');
    tracker.collect(30, 'active', out);

    tracker.clear();
    expect(tracker.collect(31, 'active', out)).toEqual([]);
  });

  it('reuses the out array and clears stale contents', () => {
    const tracker = createHitTracker();
    out.push('stale');
    tracker.enter('bat-10');

    const result = tracker.collect(40, 'active', out);
    expect(result).toBe(out);
    expect(out).toEqual(['bat-10']);

    tracker.collect(40, 'windup', out);
    expect(out).toEqual([]);
  });
});
