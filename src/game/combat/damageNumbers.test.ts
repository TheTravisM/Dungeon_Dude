import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDamageNumbers,
  DAMAGE_NUMBER_POOL_SIZE,
  forEachDamageNumber,
  spawnDamageNumber,
  type DamageNumber,
} from './damageNumbers';

function collect(nowMs: number): Array<{ slot: DamageNumber; t: number; index: number }> {
  const seen: Array<{ slot: DamageNumber; t: number; index: number }> = [];
  forEachDamageNumber(nowMs, (slot, t, index) => {
    seen.push({ slot, t, index });
  });
  return seen;
}

beforeEach(() => {
  clearDamageNumbers();
});

describe('damage numbers', () => {
  it('recycles the oldest slot when all are busy', () => {
    for (let index = 0; index < DAMAGE_NUMBER_POOL_SIZE; index++) {
      spawnDamageNumber(0, 0, 0, index + 1, 'dealt', index * 10);
    }
    spawnDamageNumber(0, 0, 0, 13, 'dealt', 200);

    const seen = collect(200);
    expect(seen).toHaveLength(DAMAGE_NUMBER_POOL_SIZE);
    expect(seen[0].index).toBe(0);
    expect(seen[0].slot.text).toBe('13');
  });

  it('reports normalized age from 0 to 1', () => {
    spawnDamageNumber(1, 2, 3, 10, 'taken', 1000);

    expect(collect(1000)[0].t).toBe(0);
    expect(collect(1350)[0].t).toBeCloseTo(0.5);
    expect(collect(1699)[0].t).toBeGreaterThan(0.99);
    expect(collect(1699)[0].t).toBeLessThan(1);
  });

  it('skips and deactivates expired slots', () => {
    spawnDamageNumber(1, 2, 3, 10, 'dealt', 1000);

    const expired = collect(1700);
    expect(expired).toHaveLength(0);
    expect(collect(1700)).toHaveLength(0);
  });

  it('keeps the newest text and kind', () => {
    spawnDamageNumber(4, 5, 6, 7, 'taken', 500);

    const [entry] = collect(500);
    expect(entry.slot.x).toBe(4);
    expect(entry.slot.y).toBe(5);
    expect(entry.slot.z).toBe(6);
    expect(entry.slot.text).toBe('7');
    expect(entry.slot.kind).toBe('taken');
  });
});
