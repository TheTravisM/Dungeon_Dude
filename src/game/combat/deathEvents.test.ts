import { beforeEach, describe, expect, it } from 'vitest';
import { drainDeaths, pushDeath, type DeathEvent } from './deathEvents';

function collect(): DeathEvent[] {
  const seen: DeathEvent[] = [];
  drainDeaths((event) => seen.push({ ...event }));
  return seen;
}

beforeEach(() => {
  drainDeaths(() => undefined);
});

describe('death events', () => {
  it('drains in insertion order and empties the queue', () => {
    pushDeath('bat-1', 10);
    pushDeath('slime-2', 20);

    expect(collect()).toEqual([
      { id: 'bat-1', atMs: 10 },
      { id: 'slime-2', atMs: 20 },
    ]);
    expect(collect()).toEqual([]);
  });

  it('keeps the newest 32 deaths on overflow', () => {
    for (let index = 0; index < 40; index++) {
      pushDeath(`monster-${index}`, index);
    }

    const events = collect();
    expect(events).toHaveLength(32);
    expect(events[0].id).toBe('monster-8');
    expect(events[31].id).toBe('monster-39');
  });
});
