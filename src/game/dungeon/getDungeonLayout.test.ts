import { describe, expect, it } from 'vitest';
import { getDungeonLayout, resolveDungeonSeed } from './getDungeonLayout';

describe('run seeds', () => {
  it('uses the run seed unchanged for the first floor', () => {
    expect(resolveDungeonSeed(1, 123456)).toBe(123456);
  });

  it('derives deeper floors deterministically from the run seed', () => {
    expect(resolveDungeonSeed(2, 123456)).toBe(resolveDungeonSeed(2, 123456));
    expect(resolveDungeonSeed(2, 123456)).not.toBe(
      resolveDungeonSeed(2, 654321)
    );
  });

  it('builds a different layout for a different run seed', () => {
    const first = getDungeonLayout(1, 111111);
    const second = getDungeonLayout(1, 222222);
    expect(first.seed).not.toBe(second.seed);
    expect(first.rooms).not.toEqual(second.rooms);
  });

  it('caches a layout by its resolved seed', () => {
    const first = getDungeonLayout(1, 333333);
    expect(getDungeonLayout(1, 333333)).toBe(first);
  });
});
