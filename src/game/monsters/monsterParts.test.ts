import { describe, expect, it } from 'vitest';
import { MONSTER_ARCHETYPES, MONSTER_ARCHETYPE_IDS } from './archetypes';
import { MONSTER_PARTS } from './monsterParts';

describe('MONSTER_PARTS', () => {
  it('has 1 to 12 parts for every archetype', () => {
    for (const id of MONSTER_ARCHETYPE_IDS) {
      const parts = MONSTER_PARTS[id];
      expect(parts.length).toBeGreaterThanOrEqual(1);
      expect(parts.length).toBeLessThanOrEqual(12);
    }
  });

  it('keeps every part inside the corridor bounds and above the floor', () => {
    for (const id of MONSTER_ARCHETYPE_IDS) {
      const stats = MONSTER_ARCHETYPES[id];
      const halfWidth = stats.radius * 1.5;
      for (const part of MONSTER_PARTS[id]) {
        const [x, y, z] = part.pos;
        const [sx, sy, sz] = part.size;
        expect(Math.abs(x) + sx / 2).toBeLessThanOrEqual(halfWidth + 1e-9);
        expect(Math.abs(z) + sz / 2).toBeLessThanOrEqual(halfWidth + 1e-9);
        expect(y + sy / 2).toBeLessThanOrEqual(stats.height + 1e-9);
        expect(y - sy / 2).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });

  it('uses valid colors, positive sizes, and finite numbers', () => {
    for (const id of MONSTER_ARCHETYPE_IDS) {
      for (const part of MONSTER_PARTS[id]) {
        expect(part.color).toMatch(/^#[0-9a-f]{6}$/i);
        if (part.emissive) {
          expect(part.emissive).toMatch(/^#[0-9a-f]{6}$/i);
        }
        for (const value of [...part.pos, ...part.size]) {
          expect(Number.isFinite(value)).toBe(true);
        }
        for (const size of part.size) {
          expect(size).toBeGreaterThan(0);
        }
      }
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(MONSTER_PARTS)).toBe(true);
    for (const id of MONSTER_ARCHETYPE_IDS) {
      expect(Object.isFrozen(MONSTER_PARTS[id])).toBe(true);
    }
  });
});
