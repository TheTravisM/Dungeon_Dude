import { beforeEach, describe, expect, it } from 'vitest';
import { drainHits, hitStats, pushHit, type HitEvent } from './hitEvents';

function collect(): HitEvent[] {
  const seen: HitEvent[] = [];
  drainHits((event) => seen.push({ ...event }));
  return seen;
}

describe('hit events', () => {
  beforeEach(() => {
    drainHits(() => undefined);
    hitStats.total = 0;
    hitStats.lastTargetId = '';
  });

  it('drains in insertion order and empties the queue', () => {
    pushHit('slime-1', 1, 100);
    pushHit('bat-2', 1, 101);

    expect(collect()).toEqual([
      { targetId: 'slime-1', swingId: 1, atMs: 100 },
      { targetId: 'bat-2', swingId: 1, atMs: 101 },
    ]);
    expect(collect()).toEqual([]);
  });

  it('keeps the newest 64 events on overflow', () => {
    for (let index = 0; index < 70; index++) {
      pushHit(`monster-${index}`, index, index);
    }

    const events = collect();
    expect(events).toHaveLength(64);
    expect(events[0].targetId).toBe('monster-6');
    expect(events[63].targetId).toBe('monster-69');
  });

  it('counts every push and records the last target', () => {
    for (let index = 0; index < 70; index++) {
      pushHit(`monster-${index}`, 1, index);
    }

    expect(hitStats.total).toBe(70);
    expect(hitStats.lastTargetId).toBe('monster-69');
  });
});
